CREATE TABLE "sesiones" (
    "id" SERIAL NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_sesiones_token_hash" ON "sesiones"("token_hash");
CREATE INDEX "ix_sesiones_fecha_expiracion" ON "sesiones"("fecha_expiracion");

ALTER TABLE "sesiones"
ADD CONSTRAINT "sesiones_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
