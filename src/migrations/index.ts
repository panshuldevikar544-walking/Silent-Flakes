import * as migration_20261126_160019_initial from './20261126_160019_initial';
import * as migration_20261126_164659_add_upload_object_key from './20261126_164659_add_upload_object_key';

export const migrations = [
  {
    up: migration_20261126_160019_initial.up,
    down: migration_20261126_160019_initial.down,
    name: '20261126_160019_initial',
  },
  {
    up: migration_20261126_164659_add_upload_object_key.up,
    down: migration_20261126_164659_add_upload_object_key.down,
    name: '20261126_164659_add_upload_object_key'
  },
];
