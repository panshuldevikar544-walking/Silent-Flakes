"""Builds the reusable book parts used by the website.

Run with:  npm run models
Axes: X = cover width, Y = thickness, Z = height (glTF export turns Z into "up").
Spine and pages are one unit thick; the website scales them to each book.
"""
import os
import sys
import traceback

import bpy
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, "public", "models")
TEXTURES = os.path.join(ROOT, "public", "textures")
LOG = os.path.join(ROOT, "blender", "last_run.log")

WIDTH, HEIGHT = 1.4, 2.1


def material(name, colour, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*colour, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def add_object(name, verts, faces, uvs, mat, smooth=False):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    layer = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        for loop in poly.loop_indices:
            layer.data[loop].uv = uvs(mesh.vertices[mesh.loops[loop].vertex_index].co, poly.normal)
        poly.use_smooth = smooth
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def box(name, sx, sy, sz, mat, bevel):
    x, y, z = sx / 2, sy / 2, sz / 2
    verts = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
             (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]

    def uvs(co, normal):
        if abs(normal.y) > 0.5:
            return (co.x / sx + 0.5, co.z / sz + 0.5)
        if abs(normal.x) > 0.5:
            return (co.y / sy + 0.5, co.z / sz + 0.5)
        return (co.y / sy + 0.5, co.x / sx + 0.5)

    obj = add_object(name, verts, faces, uvs, mat)
    if bevel:
        mod = obj.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
    return obj


def spine(name, bulge, height, mat, steps=24):
    """Rounded back of the book, curving towards -X. U runs across, V up."""
    angles = np.linspace(-np.pi / 2, np.pi / 2, steps + 1)
    verts, faces = [], []
    for a in angles:
        px, py = -bulge * float(np.cos(a)), 0.5 * float(np.sin(a))
        verts += [(px, py, -height / 2), (px, py, height / 2)]
    for i in range(steps):
        b = i * 2
        faces.append((b, b + 1, b + 3, b + 2))

    def uvs(co, _normal):
        angle = np.arcsin(max(-1.0, min(1.0, co.y * 2)))
        return (float(angle / np.pi + 0.5), co.z / height + 0.5)

    return add_object(name, verts, faces, uvs, mat, smooth=True)


def save_png(name, rgb):
    h, w, _ = rgb.shape
    image = bpy.data.images.new(name, w, h, alpha=True)
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[..., :3] = rgb
    image.pixels.foreach_set(rgba.ravel())
    image.filepath_raw = os.path.join(TEXTURES, name + ".png")
    image.file_format = "PNG"
    image.save()


def textures():
    rng = np.random.default_rng(7)
    size = 512
    # Woven cloth: two crossing thread patterns plus fibre noise, as a normal map.
    y, x = np.mgrid[0:size, 0:size]
    weave = 0.5 * np.sin(x * np.pi / 3) * np.cos(y * np.pi / 6) + 0.5 * np.sin(y * np.pi / 3) * np.cos(x * np.pi / 6)
    noise = rng.random((size, size))
    for axis in (0, 1):
        noise = (noise + np.roll(noise, 1, axis) + np.roll(noise, -1, axis)) / 3
    height = weave * 0.35 + (noise - 0.5) * 1.6
    dx = np.roll(height, -1, 1) - np.roll(height, 1, 1)
    dy = np.roll(height, -1, 0) - np.roll(height, 1, 0)
    normal = np.dstack((-dx * 0.7, -dy * 0.7, np.ones_like(height)))
    normal /= np.linalg.norm(normal, axis=2, keepdims=True)
    save_png("cloth_normal", (normal * 0.5 + 0.5).astype(np.float32))

    # Page edges: fine lines of slightly different paper tones across the thickness.
    columns = 0.9 + rng.random(size) * 0.1
    columns[::4] -= 0.14
    tone = np.tile(columns, (size, 1)) + (rng.random((size, size)) - 0.5) * 0.03
    paper = np.dstack((tone * 0.97, tone * 0.955, tone * 0.915))
    save_png("page_edges", np.clip(paper, 0, 1).astype(np.float32))


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    cover = material("cover", (0.5, 0.5, 0.5), 0.6)
    paper = material("paper", (0.85, 0.82, 0.74), 0.9)

    # Hardcover boards are thick and overhang the pages; paperback covers do not.
    box("HardBoard", WIDTH, 0.045, HEIGHT, cover, 0.012)
    box("SoftBoard", WIDTH, 0.012, HEIGHT, cover, 0.003)
    spine("HardSpine", 0.085, HEIGHT, cover)
    spine("SoftSpine", 0.022, HEIGHT, cover)
    box("HardPages", WIDTH - 0.055, 1.0, HEIGHT - 0.09, paper, 0.004)
    box("SoftPages", WIDTH - 0.006, 1.0, HEIGHT - 0.006, paper, 0.002)

    bpy.ops.export_scene.gltf(
        filepath=os.path.join(MODELS, "book_parts.glb"),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
    )
    textures()


def main():
    os.makedirs(MODELS, exist_ok=True)
    os.makedirs(TEXTURES, exist_ok=True)
    try:
        build()
        result = "OK"
    except Exception:
        result = traceback.format_exc()
    with open(LOG, "w", encoding="utf8") as handle:
        handle.write(result)
    sys.exit(0 if result == "OK" else 1)


main()
