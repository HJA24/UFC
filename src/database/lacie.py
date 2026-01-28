"""
Backup SQLite database and JSON data to LaCie external drive.

Usage:
    python src/database/lacie.py
"""

import shutil
import logging
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = Path('/Users/huibmeulenbelt/PycharmProjects/ufc')
SQLITE_DB = PROJECT_ROOT / 'data' / 'db' / 'octagon.db'
FIGHTS_JSON_DIR = PROJECT_ROOT / 'data' / 'fights' / 'ufc'
EVENTS_JSON_DIR = PROJECT_ROOT / 'data' / 'events'
LACIE_VOLUME = Path('/Volumes/LaCie')
BACKUP_DIR = LACIE_VOLUME / 'mmarkov' / 'backups'


def check_lacie_mounted() -> bool:
    """Check if LaCie drive is mounted."""
    return LACIE_VOLUME.exists() and LACIE_VOLUME.is_mount()


def check_sqlite_exists() -> bool:
    """Check if SQLite database exists."""
    return SQLITE_DB.exists()


def get_dir_size_mb(path: Path) -> float:
    """Get total size of directory in MB."""
    total = sum(f.stat().st_size for f in path.rglob('*') if f.is_file())
    return total / (1024 * 1024)


def create_db_backup(timestamp: str) -> Path:
    """Create timestamped backup of SQLite database."""
    backup_filename = f'octagon_{timestamp}.db'
    backup_path = BACKUP_DIR / backup_filename

    shutil.copy2(SQLITE_DB, backup_path)
    return backup_path


def create_json_backup(source_dir: Path, name: str, timestamp: str) -> Path:
    """Create timestamped compressed backup of JSON directory."""
    backup_filename = f'{name}_{timestamp}'
    backup_path = BACKUP_DIR / backup_filename

    # Create zip archive
    shutil.make_archive(str(backup_path), 'zip', source_dir)
    return Path(f'{backup_path}.zip')


def cleanup_old_backups(pattern: str, keep: int = 3):
    """Keep only the most recent N backups matching pattern."""
    backups = sorted(BACKUP_DIR.glob(pattern), reverse=True)

    for old_backup in backups[keep:]:
        old_backup.unlink()
        logger.info(f'Deleted old backup: {old_backup.name}')


def main():
    logger.info('Starting LaCie backup')

    # Check LaCie is mounted
    if not check_lacie_mounted():
        logger.error(f'LaCie not mounted at {LACIE_VOLUME}')
        raise SystemExit(1)

    # Ensure backup directory exists
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Backup SQLite database
    if check_sqlite_exists():
        db_size_mb = SQLITE_DB.stat().st_size / (1024 * 1024)
        logger.info(f'SQLite database size: {db_size_mb:.2f} MB')
        backup_path = create_db_backup(timestamp)
        logger.info(f'SQLite backup created: {backup_path.name}')
        cleanup_old_backups('octagon_*.db', keep=3)
    else:
        logger.warning(f'SQLite database not found at {SQLITE_DB}')

    # Backup fights JSON
    if FIGHTS_JSON_DIR.exists():
        fights_size_mb = get_dir_size_mb(FIGHTS_JSON_DIR)
        json_count = len(list(FIGHTS_JSON_DIR.glob('*.json')))
        logger.info(f'Fights JSON: {json_count} files, {fights_size_mb:.2f} MB')
        backup_path = create_json_backup(FIGHTS_JSON_DIR, 'fights', timestamp)
        logger.info(f'Fights backup created: {backup_path.name}')
        cleanup_old_backups('fights_*.zip', keep=3)
    else:
        logger.warning(f'Fights directory not found at {FIGHTS_JSON_DIR}')

    # Backup events JSON
    if EVENTS_JSON_DIR.exists():
        events_size_mb = get_dir_size_mb(EVENTS_JSON_DIR)
        json_count = len(list(EVENTS_JSON_DIR.glob('*.json')))
        logger.info(f'Events JSON: {json_count} files, {events_size_mb:.2f} MB')
        backup_path = create_json_backup(EVENTS_JSON_DIR, 'events', timestamp)
        logger.info(f'Events backup created: {backup_path.name}')
        cleanup_old_backups('events_*.zip', keep=3)
    else:
        logger.warning(f'Events directory not found at {EVENTS_JSON_DIR}')

    # Summary
    all_backups = list(BACKUP_DIR.glob('*'))
    total_size_mb = sum(f.stat().st_size for f in all_backups if f.is_file()) / (1024 * 1024)
    logger.info(f'Total backups on LaCie: {len(all_backups)} files, {total_size_mb:.2f} MB')

    logger.info('LaCie backup complete')


if __name__ == '__main__':
    main()
