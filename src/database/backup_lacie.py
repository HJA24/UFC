"""
Backup SQLite database to LaCie external drive.

Usage:
    python src/database/backup_lacie.py
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
LACIE_VOLUME = Path('/Volumes/LaCie')
BACKUP_DIR = LACIE_VOLUME / 'mmarkov' / 'backups'


def check_lacie_mounted() -> bool:
    """Check if LaCie drive is mounted."""
    return LACIE_VOLUME.exists() and LACIE_VOLUME.is_mount()


def check_sqlite_exists() -> bool:
    """Check if SQLite database exists."""
    return SQLITE_DB.exists()


def create_backup() -> Path:
    """Create timestamped backup of SQLite database."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f'octagon_{timestamp}.db'
    backup_path = BACKUP_DIR / backup_filename

    # Ensure backup directory exists
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    # Copy database
    shutil.copy2(SQLITE_DB, backup_path)

    return backup_path


def cleanup_old_backups(keep: int = 10):
    """Keep only the most recent N backups."""
    backups = sorted(BACKUP_DIR.glob('octagon_*.db'), reverse=True)

    for old_backup in backups[keep:]:
        old_backup.unlink()
        logger.info(f'Deleted old backup: {old_backup.name}')


def main():
    logger.info('Starting LaCie backup')

    # Check LaCie is mounted
    if not check_lacie_mounted():
        logger.error(f'LaCie not mounted at {LACIE_VOLUME}')
        raise SystemExit(1)

    # Check SQLite database exists
    if not check_sqlite_exists():
        logger.error(f'SQLite database not found at {SQLITE_DB}')
        raise SystemExit(1)

    # Get database size
    db_size_mb = SQLITE_DB.stat().st_size / (1024 * 1024)
    logger.info(f'Database size: {db_size_mb:.2f} MB')

    # Create backup
    backup_path = create_backup()
    logger.info(f'Backup created: {backup_path}')

    # Cleanup old backups
    cleanup_old_backups(keep=10)

    # List current backups
    backups = sorted(BACKUP_DIR.glob('octagon_*.db'), reverse=True)
    logger.info(f'Total backups on LaCie: {len(backups)}')

    logger.info('LaCie backup complete')


if __name__ == '__main__':
    main()
