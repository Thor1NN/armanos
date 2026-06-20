import * as migration_20260613_121742 from './20260613_121742';
import * as migration_20260614_095031 from './20260614_095031';
import * as migration_20260616_115403 from './20260616_115403';
import * as migration_20260618_162028_security_versioning from './20260618_162028_security_versioning';
import * as migration_20260618_172305_drop_share_links_versions from './20260618_172305_drop_share_links_versions';
import * as migration_20260620_195052_exercise_logs from './20260620_195052_exercise_logs';
import * as migration_20260620_200543_exercise_logs_relations from './20260620_200543_exercise_logs_relations';

export const migrations = [
  {
    up: migration_20260613_121742.up,
    down: migration_20260613_121742.down,
    name: '20260613_121742',
  },
  {
    up: migration_20260614_095031.up,
    down: migration_20260614_095031.down,
    name: '20260614_095031',
  },
  {
    up: migration_20260616_115403.up,
    down: migration_20260616_115403.down,
    name: '20260616_115403',
  },
  {
    up: migration_20260618_162028_security_versioning.up,
    down: migration_20260618_162028_security_versioning.down,
    name: '20260618_162028_security_versioning',
  },
  {
    up: migration_20260618_172305_drop_share_links_versions.up,
    down: migration_20260618_172305_drop_share_links_versions.down,
    name: '20260618_172305_drop_share_links_versions',
  },
  {
    up: migration_20260620_195052_exercise_logs.up,
    down: migration_20260620_195052_exercise_logs.down,
    name: '20260620_195052_exercise_logs',
  },
  {
    up: migration_20260620_200543_exercise_logs_relations.up,
    down: migration_20260620_200543_exercise_logs_relations.down,
    name: '20260620_200543_exercise_logs_relations'
  },
];
