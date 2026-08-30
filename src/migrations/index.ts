import * as migration_20260613_121742 from './20260613_121742';
import * as migration_20260614_095031 from './20260614_095031';
import * as migration_20260616_115403 from './20260616_115403';
import * as migration_20260618_162028_security_versioning from './20260618_162028_security_versioning';
import * as migration_20260618_172305_drop_share_links_versions from './20260618_172305_drop_share_links_versions';
import * as migration_20260620_195052_exercise_logs from './20260620_195052_exercise_logs';
import * as migration_20260620_200543_exercise_logs_relations from './20260620_200543_exercise_logs_relations';
import * as migration_20260622_112303_bundle_with_previous from './20260622_112303_bundle_with_previous';
import * as migration_20260724_065545 from './20260724_065545';
import * as migration_20260724_073306 from './20260724_073306';
import * as migration_20260724_090318 from './20260724_090318';
import * as migration_20260829_160754_armanos_integrity from './20260829_160754_armanos_integrity';
import * as migration_20260830_115703_diary_entries from './20260830_115703_diary_entries';
import * as migration_20260830_121520_foods_and_meal_items from './20260830_121520_foods_and_meal_items';
import * as migration_20260830_124858_kcal_target from './20260830_124858_kcal_target';

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
    name: '20260620_200543_exercise_logs_relations',
  },
  {
    up: migration_20260622_112303_bundle_with_previous.up,
    down: migration_20260622_112303_bundle_with_previous.down,
    name: '20260622_112303_bundle_with_previous',
  },
  {
    up: migration_20260724_065545.up,
    down: migration_20260724_065545.down,
    name: '20260724_065545',
  },
  {
    up: migration_20260724_073306.up,
    down: migration_20260724_073306.down,
    name: '20260724_073306',
  },
  {
    up: migration_20260724_090318.up,
    down: migration_20260724_090318.down,
    name: '20260724_090318',
  },
  {
    up: migration_20260829_160754_armanos_integrity.up,
    down: migration_20260829_160754_armanos_integrity.down,
    name: '20260829_160754_armanos_integrity',
  },
  {
    up: migration_20260830_115703_diary_entries.up,
    down: migration_20260830_115703_diary_entries.down,
    name: '20260830_115703_diary_entries',
  },
  {
    up: migration_20260830_121520_foods_and_meal_items.up,
    down: migration_20260830_121520_foods_and_meal_items.down,
    name: '20260830_121520_foods_and_meal_items',
  },
  {
    up: migration_20260830_124858_kcal_target.up,
    down: migration_20260830_124858_kcal_target.down,
    name: '20260830_124858_kcal_target'
  },
];
