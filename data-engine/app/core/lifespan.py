from contextlib import asynccontextmanager
print("📢 FastAPI 시작 중...")
try:
    from ..scheduler import scheduler
    print("✅ 스케줄러 모듈 로드 완료")
except Exception as e:
    print(f"❌ 스케줄러 모듈 로드 실패: {e}")
    import traceback
    traceback.print_exc()
    scheduler = None

@asynccontextmanager
async def lifespan(app):
    print("🚀 FastAPI 애플리케이션 시작")

    # 데이터베이스 연결
    try:
        from ..core.database import connect_database, close_database
        await connect_database()
        print("✅ 데이터베이스 연결 완료")
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")

    # 스케줄러 시작
    if scheduler:
        scheduler.start()
        jobs = scheduler.get_jobs()
        print(f"📋 스케줄 작업 {len(jobs)}개 등록됨")
        for job in jobs:
            print(f"  - {job.func.__name__}: {job.next_run_time}")
    else:
        print("❌ 스케줄러를 사용할 수 없습니다")

    print("✅ FastAPI 시작 완료")

    yield

    print("🛑 FastAPI 종료 중...")

    # 스케줄러 종료
    if scheduler:
        scheduler.shutdown()

    # 데이터베이스 연결 종료
    try:
        await close_database()
        print("✅ 데이터베이스 연결 종료 완료")
    except Exception as e:
        print(f"❌ 데이터베이스 연결 종료 실패: {e}")

    print("✅ FastAPI 종료 완료")