# qetta — Fullstack Master Deploy (V2, Prisma stages fixed) — 2025-10-26

- Prisma CLI/Client 빌드·실행 단계 분리(멀티스테이지) → **migrate 컨테이너 안정**
- docker-compose: `api`는 runtime 타깃, `migrate`는 deps 타깃 사용
- smoke: `jq` 비존재 환경도 동작(SED fallback)

## 빠른 시작
```bash
unzip qetta_master_deploy_fullstack_v2_2025-10-26.zip -d qetta-full-v2
cd qetta-full-v2/qetta
cp .env.example .env
./tools/codex up
./tools/codex smoke
```
