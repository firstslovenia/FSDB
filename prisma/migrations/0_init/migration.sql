-- CreateTable
CREATE TABLE "ReactionRole" (
    "id" TEXT NOT NULL,
    "questionContents" TEXT NOT NULL,

    CONSTRAINT "ReactionRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReactionRoleEmoji" (
    "id" SERIAL NOT NULL,
    "emoji" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "reactionRoleId" TEXT NOT NULL,

    CONSTRAINT "ReactionRoleEmoji_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReactionRoleEmoji" ADD CONSTRAINT "ReactionRoleEmoji_reactionRoleId_fkey" FOREIGN KEY ("reactionRoleId") REFERENCES "ReactionRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

