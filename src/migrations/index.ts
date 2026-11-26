import * as migration_20261126_160019_initial from './20261126_160019_initial';

export const migrations = [
  {
    up: migration_20261126_160019_initial.up,
    down: migration_20261126_160019_initial.down,
    name: '20261126_160019_initial'
  },
];
