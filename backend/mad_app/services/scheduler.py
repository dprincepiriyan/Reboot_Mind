import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from mad_app.db.session import AsyncSessionLocal
from mad_app.services.matching import run_matching_batch
from mad_app.services.graduation import check_graduated_groups

logger = logging.getLogger("scheduler")
scheduler = AsyncIOScheduler()

async def scheduled_matching_job(sio=None):
    async with AsyncSessionLocal() as db:
        try:
            await run_matching_batch(db, sio=sio)
        except Exception as e:
            logger.error(f"Error running scheduled matching job: {e}", exc_info=True)

async def scheduled_graduation_job(sio=None):
    async with AsyncSessionLocal() as db:
        try:
            await check_graduated_groups(db, sio=sio)
        except Exception as e:
            logger.error(f"Error running scheduled graduation job: {e}", exc_info=True)

def start_scheduler(sio=None):
    scheduler.add_job(
        scheduled_matching_job,
        'interval',
        seconds=15,
        args=[sio],
        id='matching_batch_job',
        replace_existing=True,
        max_instances=1,
        coalesce=True
    )
    scheduler.add_job(
        scheduled_graduation_job,
        'interval',
        seconds=15,
        args=[sio],
        id='graduation_job',
        replace_existing=True,
        max_instances=1,
        coalesce=True
    )
    scheduler.start()
    logger.info("APScheduler started: running matching batch and graduation jobs every 15s (coalesced, max 1 instance)")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down")
