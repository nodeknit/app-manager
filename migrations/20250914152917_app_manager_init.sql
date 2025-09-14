-- Create "apps" table
CREATE TABLE "public"."apps" (
  "appId" character varying(255) NOT NULL,
  "enable" boolean NULL,
  PRIMARY KEY ("appId")
);
-- Create "settings" table
CREATE TABLE "public"."settings" (
  "key" character varying(255) NOT NULL,
  "value" json NULL,
  PRIMARY KEY ("key")
);
