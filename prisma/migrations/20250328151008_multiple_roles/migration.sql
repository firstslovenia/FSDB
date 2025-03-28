ALTER TABLE "ReactionRoleEmoji"
ADD COLUMN "roleIds" TEXT[] NULL;

UPDATE "ReactionRoleEmoji"
SET "roleIds" = ARRAY["roleId"]
WHERE "roleId" IS NOT NULL;