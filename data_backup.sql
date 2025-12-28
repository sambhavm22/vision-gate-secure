SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict hkprEm6VQLVwEQ86CoYX1FxXAd5fn3apbdb739d7s0Vw7d8E2D5d3E6gKzVZXV4

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'bf26b4bb-7c5b-47a9-9427-e0970ff2df7d', 'authenticated', 'authenticated', 'all2@rounder.com', '$2a$10$AI1m8V/A5F.4QAvR9zg.FuujoYqBKQ20wVFyqjkc8CtrirmE2IuXi', '2025-12-05 14:49:09.94007+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-12-10 16:25:00.131797+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-12-05 14:49:09.932065+00', '2025-12-10 16:25:00.150045+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '3d746e2c-ca84-4fbc-ace1-88fb85094a5a', 'authenticated', 'authenticated', 'katariyaprakhar2@gmail.com', NULL, '2025-12-05 15:17:04.672716+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-12-05 15:17:04.677796+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "107590083073618272836", "name": "Prakhar2", "email": "katariyaprakhar2@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocK2l6PB4UbqFUlDanbbOTDJT-uwQSCiRwW_uOo3O93XUlcjoA=s96-c", "full_name": "Prakhar2", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK2l6PB4UbqFUlDanbbOTDJT-uwQSCiRwW_uOo3O93XUlcjoA=s96-c", "provider_id": "107590083073618272836", "email_verified": true, "phone_verified": false}', NULL, '2025-12-05 15:17:04.662652+00', '2025-12-10 16:18:23.446207+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '43f38d7e-1927-4f1c-9ac7-9ecdc78aeb2b', 'authenticated', 'authenticated', 'all3@rounder.com', '$2a$10$LMPmq6QU1Mo3/SjJ292W1O/lMkYdDVOKt2RlZqt.LwgWfh5ZsC4CC', NULL, NULL, '3c668bfb1b9c5b8560de19433a316c89b969692a295734e5c3d4b985', '2025-12-10 16:35:21.565661+00', '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"sub": "43f38d7e-1927-4f1c-9ac7-9ecdc78aeb2b", "role": "worker", "email": "all3@rounder.com", "full_name": "All Rounder 3", "email_verified": false, "phone_verified": false}', NULL, '2025-12-10 16:35:21.537336+00', '2025-12-10 16:35:24.314373+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', 'authenticated', 'authenticated', 'katariyaprakhar1@gmail.com', '$2a$10$tszPwu38bTXT5ozBhU/wz.H0yrKrpBmKOE/EK3GJqQO8U5dl4MCkS', '2025-12-10 16:38:03.911129+00', NULL, '', '2025-12-10 16:37:45.358778+00', '', '2025-12-16 16:15:18.303659+00', '', '', NULL, '2025-12-16 16:15:47.465018+00', '{"provider": "email", "providers": ["email", "google"]}', '{"iss": "https://accounts.google.com", "sub": "114725464143858370956", "name": "Prakhar Katariya", "role": "worker", "email": "katariyaprakhar1@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJ3EuBGiqLcutgPrbu92bDYHt6eIg5biCJ2zP8YxiamHbj_Mv5K=s96-c", "full_name": "Prakhar Katariya", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJ3EuBGiqLcutgPrbu92bDYHt6eIg5biCJ2zP8YxiamHbj_Mv5K=s96-c", "provider_id": "114725464143858370956", "email_verified": true, "phone_verified": false}', NULL, '2025-12-10 16:37:45.350339+00', '2025-12-27 09:10:27.830427+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '3a12fbc1-b307-415a-a8c3-d376a894f101', 'authenticated', 'authenticated', NULL, '$2a$10$0A4X01FUe5VrOioEyXIMEe8nytJGqs6TC.Xvm0OuZnGeJ7UeWzoWe', NULL, NULL, '4d1ff0b821c0093c7fac7f278abddab477f3ff789c7efce542b5cff6', '2025-12-25 07:24:55.669256+00', '', NULL, '', '', NULL, NULL, '{"provider": "phone", "providers": ["phone"]}', '{"sub": "3a12fbc1-b307-415a-a8c3-d376a894f101", "email_verified": false, "phone_verified": false}', NULL, '2025-12-25 07:24:55.641511+00', '2025-12-25 07:24:56.022137+00', '917611953225', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'cd0ae54a-3fac-44c6-b3d4-c5f9cde92e20', 'authenticated', 'authenticated', NULL, '$2a$10$9pv1ez9BfIYQwthqa4ox8eNcLTTH5DrdOghH.XJEQQ2xnghuHaiHS', NULL, NULL, '1a9291e143fe3d59d4c85ebab18a2c2b5ab921b81ffee8ed3d827b58', '2025-12-25 13:28:36.618354+00', '', NULL, '', '', NULL, NULL, '{"provider": "phone", "providers": ["phone"]}', '{"sub": "cd0ae54a-3fac-44c6-b3d4-c5f9cde92e20", "email_verified": false, "phone_verified": false}', NULL, '2025-12-25 06:46:50.956954+00', '2025-12-25 13:28:36.989366+00', '917568564423', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '809bccea-8e4f-4b79-a37f-f696b0020449', 'authenticated', 'authenticated', NULL, '$2a$10$tgDXMUZgI2.KGYwXCYciBuAkCnKWTTqfR.b/Ohh/DPx/jnab809L6', '2025-12-25 15:26:51.024034+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "phone", "providers": ["phone"]}', '{"email_verified": true, "phone_verified": true}', NULL, '2025-12-25 15:26:50.999036+00', '2025-12-25 15:26:51.031699+00', '17656762485', '2025-12-25 15:26:51.031468+00', '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', 'authenticated', 'authenticated', 'sambhav.mehta2210@gmail.com', NULL, '2025-12-12 09:32:06.215845+00', NULL, '', NULL, '', '2025-12-27 06:06:19.669726+00', '', '', NULL, '2025-12-27 06:06:34.64257+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "105448067619547491028", "name": "Sambhav Mehta", "email": "sambhav.mehta2210@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIAP3dOWvqFrXYkt3JPG8BDjjkcdj6vUunkHjSi7wW8BGuTcA=s96-c", "full_name": "Sambhav Mehta", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIAP3dOWvqFrXYkt3JPG8BDjjkcdj6vUunkHjSi7wW8BGuTcA=s96-c", "provider_id": "105448067619547491028", "email_verified": true, "phone_verified": false}', NULL, '2025-12-12 09:32:06.177362+00', '2025-12-28 10:36:49.42821+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', 'authenticated', 'authenticated', 'sambhavm22@gmail.com', NULL, '2025-12-06 07:05:04.508168+00', NULL, '', NULL, '', '2025-12-28 11:28:20.237441+00', '', '', NULL, '2025-12-28 11:28:32.818312+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "102735062808556576990", "name": "Sambhav Mehta", "email": "sambhavm22@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocI2eNssvUVPTRRXPJKgNUn9eEtHPk4f8xvTk1noWOmGBhLgwQ=s96-c", "full_name": "Sambhav Mehta", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocI2eNssvUVPTRRXPJKgNUn9eEtHPk4f8xvTk1noWOmGBhLgwQ=s96-c", "provider_id": "102735062808556576990", "email_verified": true, "phone_verified": false}', NULL, '2025-12-06 07:05:04.449809+00', '2025-12-28 16:21:56.304895+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('bf26b4bb-7c5b-47a9-9427-e0970ff2df7d', 'bf26b4bb-7c5b-47a9-9427-e0970ff2df7d', '{"sub": "bf26b4bb-7c5b-47a9-9427-e0970ff2df7d", "email": "all2@rounder.com", "email_verified": false, "phone_verified": false}', 'email', '2025-12-05 14:49:09.937177+00', '2025-12-05 14:49:09.937243+00', '2025-12-05 14:49:09.937243+00', '51aefe50-81c7-4537-b41f-94865f5cee1d'),
	('107590083073618272836', '3d746e2c-ca84-4fbc-ace1-88fb85094a5a', '{"iss": "https://accounts.google.com", "sub": "107590083073618272836", "name": "Prakhar2", "email": "katariyaprakhar2@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocK2l6PB4UbqFUlDanbbOTDJT-uwQSCiRwW_uOo3O93XUlcjoA=s96-c", "full_name": "Prakhar2", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK2l6PB4UbqFUlDanbbOTDJT-uwQSCiRwW_uOo3O93XUlcjoA=s96-c", "provider_id": "107590083073618272836", "email_verified": true, "phone_verified": false}', 'google', '2025-12-05 15:17:04.669076+00', '2025-12-05 15:17:04.669125+00', '2025-12-05 15:17:04.669125+00', '69bddf67-9133-484c-b7ca-02c946054685'),
	('105448067619547491028', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', '{"iss": "https://accounts.google.com", "sub": "105448067619547491028", "name": "Sambhav Mehta", "email": "sambhav.mehta2210@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIAP3dOWvqFrXYkt3JPG8BDjjkcdj6vUunkHjSi7wW8BGuTcA=s96-c", "full_name": "Sambhav Mehta", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIAP3dOWvqFrXYkt3JPG8BDjjkcdj6vUunkHjSi7wW8BGuTcA=s96-c", "provider_id": "105448067619547491028", "email_verified": true, "phone_verified": false}', 'google', '2025-12-12 09:32:06.209758+00', '2025-12-12 09:32:06.210406+00', '2025-12-24 10:52:57.625393+00', 'e5442fb6-3b5d-4f76-8264-1d237fc8a886'),
	('3a12fbc1-b307-415a-a8c3-d376a894f101', '3a12fbc1-b307-415a-a8c3-d376a894f101', '{"sub": "3a12fbc1-b307-415a-a8c3-d376a894f101", "email_verified": false, "phone_verified": false}', 'phone', '2025-12-25 07:24:55.66362+00', '2025-12-25 07:24:55.663673+00', '2025-12-25 07:24:55.663673+00', '3c0ea688-a71c-46a3-b591-2592668d7cf8'),
	('809bccea-8e4f-4b79-a37f-f696b0020449', '809bccea-8e4f-4b79-a37f-f696b0020449', '{"sub": "809bccea-8e4f-4b79-a37f-f696b0020449", "phone": "17656762485", "email_verified": false, "phone_verified": false}', 'phone', '2025-12-25 15:26:51.014811+00', '2025-12-25 15:26:51.014872+00', '2025-12-25 15:26:51.014872+00', 'bca6b268-73e1-4876-824c-d6751682de4f'),
	('43f38d7e-1927-4f1c-9ac7-9ecdc78aeb2b', '43f38d7e-1927-4f1c-9ac7-9ecdc78aeb2b', '{"sub": "43f38d7e-1927-4f1c-9ac7-9ecdc78aeb2b", "role": "worker", "email": "all3@rounder.com", "full_name": "All Rounder 3", "email_verified": false, "phone_verified": false}', 'email', '2025-12-10 16:35:21.556779+00', '2025-12-10 16:35:21.556847+00', '2025-12-10 16:35:21.556847+00', '3d1c690f-b5cc-4bc2-83fa-169138894e01'),
	('4c13a0b8-1430-4089-97b5-c2d7bcb0b937', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', '{"sub": "4c13a0b8-1430-4089-97b5-c2d7bcb0b937", "role": "worker", "email": "katariyaprakhar1@gmail.com", "full_name": "Prakhar Katariya", "email_verified": true, "phone_verified": false}', 'email', '2025-12-10 16:37:45.355233+00', '2025-12-10 16:37:45.355284+00', '2025-12-10 16:37:45.355284+00', 'c169aa08-b9ba-426a-94ab-7b4101064c49'),
	('114725464143858370956', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', '{"iss": "https://accounts.google.com", "sub": "114725464143858370956", "name": "Prakhar Katariya", "email": "katariyaprakhar1@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJ3EuBGiqLcutgPrbu92bDYHt6eIg5biCJ2zP8YxiamHbj_Mv5K=s96-c", "full_name": "Prakhar Katariya", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJ3EuBGiqLcutgPrbu92bDYHt6eIg5biCJ2zP8YxiamHbj_Mv5K=s96-c", "provider_id": "114725464143858370956", "email_verified": true, "phone_verified": false}', 'google', '2025-12-10 16:43:04.717117+00', '2025-12-10 16:43:04.717176+00', '2025-12-16 16:00:46.956075+00', '5645ab68-9349-4855-b3c8-e324877927a8'),
	('cd0ae54a-3fac-44c6-b3d4-c5f9cde92e20', 'cd0ae54a-3fac-44c6-b3d4-c5f9cde92e20', '{"sub": "cd0ae54a-3fac-44c6-b3d4-c5f9cde92e20", "email_verified": false, "phone_verified": false}', 'phone', '2025-12-25 06:46:50.97645+00', '2025-12-25 06:46:50.976498+00', '2025-12-25 06:46:50.976498+00', '9a756114-6ed1-4186-a972-694a19f648fe'),
	('102735062808556576990', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', '{"iss": "https://accounts.google.com", "sub": "102735062808556576990", "name": "Sambhav Mehta", "email": "sambhavm22@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocI2eNssvUVPTRRXPJKgNUn9eEtHPk4f8xvTk1noWOmGBhLgwQ=s96-c", "full_name": "Sambhav Mehta", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocI2eNssvUVPTRRXPJKgNUn9eEtHPk4f8xvTk1noWOmGBhLgwQ=s96-c", "provider_id": "102735062808556576990", "email_verified": true, "phone_verified": false}', 'google', '2025-12-06 07:05:04.500413+00', '2025-12-06 07:05:04.500481+00', '2025-12-28 11:21:40.381069+00', 'ac81c6d1-6b5f-43a1-8606-3dd925523bab');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', '2025-12-16 16:15:47.46512+00', '2025-12-27 09:10:19.120322+00', NULL, 'aal1', NULL, '2025-12-27 09:10:19.119602', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '49.36.187.198', NULL, NULL, NULL, NULL, NULL),
	('5415021a-518b-41cc-abfc-fbc7f038491b', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', '2025-12-16 14:51:12.389483+00', '2025-12-27 09:10:27.835679+00', NULL, 'aal1', NULL, '2025-12-27 09:10:27.835564', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '49.36.187.198', NULL, NULL, NULL, NULL, NULL),
	('dd0d2dc9-81ec-4d1d-8580-2424f31d2019', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', '2025-12-27 06:06:34.642665+00', '2025-12-28 10:36:49.439812+00', NULL, 'aal1', NULL, '2025-12-28 10:36:49.439101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '49.36.235.190', NULL, NULL, NULL, NULL, NULL),
	('3547c1ca-28f7-4783-b287-60a919ab516a', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', '2025-12-27 06:05:42.759403+00', '2025-12-28 10:50:14.861849+00', NULL, 'aal1', NULL, '2025-12-28 10:50:14.861744', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '49.36.235.190', NULL, NULL, NULL, NULL, NULL),
	('5d29d61c-7e19-42f0-a10d-8b61cad66668', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', '2025-12-28 11:10:26.612633+00', '2025-12-28 11:10:26.612633+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '49.36.235.190', NULL, NULL, NULL, NULL, NULL),
	('e3c34261-252e-4653-909e-63c13796844d', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', '2025-12-28 11:21:40.406505+00', '2025-12-28 16:21:56.318311+00', NULL, 'aal1', NULL, '2025-12-28 16:21:56.318199', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '223.181.47.140', NULL, NULL, NULL, NULL, NULL),
	('3a3e7e09-5a04-4c77-b7a5-8c7624e10ff5', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', '2025-12-28 11:28:32.818407+00', '2025-12-28 16:21:56.330629+00', NULL, 'aal1', NULL, '2025-12-28 16:21:56.330513', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '223.181.47.140', NULL, NULL, NULL, NULL, NULL),
	('7bc9b4ce-ccb4-4b90-bc28-d8f87ece353f', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', '2025-12-16 16:00:46.994009+00', '2025-12-16 16:00:46.994009+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '49.36.185.144', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('5415021a-518b-41cc-abfc-fbc7f038491b', '2025-12-16 14:51:12.418129+00', '2025-12-16 14:51:12.418129+00', 'oauth', 'a22bf2d1-961c-479e-94f1-eaaf6fdbc0c5'),
	('7bc9b4ce-ccb4-4b90-bc28-d8f87ece353f', '2025-12-16 16:00:47.040705+00', '2025-12-16 16:00:47.040705+00', 'oauth', 'd330c535-14c9-4833-85a7-18ca66c0d526'),
	('f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7', '2025-12-16 16:15:47.486361+00', '2025-12-16 16:15:47.486361+00', 'otp', '5602e085-1e9c-4b94-94fc-14eb9c86447a'),
	('3547c1ca-28f7-4783-b287-60a919ab516a', '2025-12-27 06:05:42.821511+00', '2025-12-27 06:05:42.821511+00', 'oauth', '52f84c83-9c43-460e-9fbd-328947edaec6'),
	('dd0d2dc9-81ec-4d1d-8580-2424f31d2019', '2025-12-27 06:06:34.646744+00', '2025-12-27 06:06:34.646744+00', 'otp', '6e678777-9da7-4419-b2e8-1f5794314506'),
	('5d29d61c-7e19-42f0-a10d-8b61cad66668', '2025-12-28 11:10:26.638853+00', '2025-12-28 11:10:26.638853+00', 'oauth', '5bf138fb-146d-4221-b09e-c008bca62442'),
	('e3c34261-252e-4653-909e-63c13796844d', '2025-12-28 11:21:40.438198+00', '2025-12-28 11:21:40.438198+00', 'oauth', 'f400f390-c69c-4592-8cbe-4873da23fe3f'),
	('3a3e7e09-5a04-4c77-b7a5-8c7624e10ff5', '2025-12-28 11:28:32.825642+00', '2025-12-28 11:28:32.825642+00', 'otp', '17e8350c-094e-4f79-b36f-c1727dbf6dc7');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('d0814b9f-9b94-428b-afc2-ea9f8f8878df', '43f38d7e-1927-4f1c-9ac7-9ecdc78aeb2b', 'confirmation_token', '3c668bfb1b9c5b8560de19433a316c89b969692a295734e5c3d4b985', 'all3@rounder.com', '2025-12-10 16:35:24.320255', '2025-12-10 16:35:24.320255'),
	('d7615af0-e758-4757-871c-5a03fcf1c7c7', '3a12fbc1-b307-415a-a8c3-d376a894f101', 'confirmation_token', '4d1ff0b821c0093c7fac7f278abddab477f3ff789c7efce542b5cff6', '917611953225', '2025-12-25 07:24:56.028014', '2025-12-25 07:24:56.028014'),
	('a57721a8-8607-4593-8556-d1a36231c798', 'cd0ae54a-3fac-44c6-b3d4-c5f9cde92e20', 'confirmation_token', '1a9291e143fe3d59d4c85ebab18a2c2b5ab921b81ffee8ed3d827b58', '917568564423', '2025-12-25 13:28:37.019204', '2025-12-25 13:28:37.019204');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 120, '7epjsoqwqwsg', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-26 17:00:47.026053+00', '2025-12-27 05:53:53.419413+00', 'l7sacv3efmqy', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 123, 'd467lk27yozp', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-27 06:05:42.79133+00', '2025-12-27 07:13:57.316289+00', NULL, '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 124, 'b5pvijcmr4ka', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', true, '2025-12-27 06:06:34.644198+00', '2025-12-27 07:13:57.316121+00', NULL, 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 126, 'mrxv4ozphibw', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', true, '2025-12-27 07:13:57.345239+00', '2025-12-27 08:13:13.747691+00', 'b5pvijcmr4ka', 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 128, 'lo2zlweftcyf', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', true, '2025-12-27 08:13:13.76718+00', '2025-12-27 09:40:19.685634+00', 'mrxv4ozphibw', 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 129, '4dqeyhl434ls', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-27 08:13:13.767385+00', '2025-12-27 09:40:40.040776+00', 'fkhue4mmsrl7', '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 133, '5nskhcn32esn', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-27 09:40:40.041182+00', '2025-12-27 10:55:49.508544+00', '4dqeyhl434ls', '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 132, 'mkzvo4n6ahsh', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', true, '2025-12-27 09:40:19.700671+00', '2025-12-27 10:55:49.507728+00', 'lo2zlweftcyf', 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 136, 'rz7bk6zdneoi', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', true, '2025-12-28 04:16:12.244304+00', '2025-12-28 06:29:17.317431+00', 'plpu54gw4guk', 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 138, 'vroi223pf4rn', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', true, '2025-12-28 06:29:17.339819+00', '2025-12-28 07:46:42.169641+00', 'rz7bk6zdneoi', 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 141, 'mq4qbzovnbc4', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', true, '2025-12-28 07:46:42.170035+00', '2025-12-28 08:53:03.985536+00', 'vroi223pf4rn', 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 56, '5hfuwi4567dd', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', false, '2025-12-16 16:00:47.020728+00', '2025-12-16 16:00:47.020728+00', NULL, '7bc9b4ce-ccb4-4b90-bc28-d8f87ece353f'),
	('00000000-0000-0000-0000-000000000000', 55, 'c6eqb4f4poaz', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-16 14:51:12.403795+00', '2025-12-16 16:01:04.336056+00', NULL, '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 140, 'd27wbnygxynb', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-28 07:45:11.684958+00', '2025-12-28 08:54:03.365139+00', 'gmnwlgpkrmjf', '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 144, 'ahhp64a6bbei', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', false, '2025-12-28 10:36:49.420845+00', '2025-12-28 10:36:49.420845+00', 'x4of5x7tc7u7', 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 146, 'ilvg56gqlwym', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', false, '2025-12-28 11:10:26.629029+00', '2025-12-28 11:10:26.629029+00', NULL, '5d29d61c-7e19-42f0-a10d-8b61cad66668'),
	('00000000-0000-0000-0000-000000000000', 148, 'z5s3njidpchn', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-28 11:28:32.819906+00', '2025-12-28 16:21:56.274164+00', NULL, '3a3e7e09-5a04-4c77-b7a5-8c7624e10ff5'),
	('00000000-0000-0000-0000-000000000000', 150, 'exjmolulmu3h', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', false, '2025-12-28 16:21:56.293668+00', '2025-12-28 16:21:56.293668+00', 'z5s3njidpchn', '3a3e7e09-5a04-4c77-b7a5-8c7624e10ff5'),
	('00000000-0000-0000-0000-000000000000', 57, 'qskqklmgrk7m', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-16 16:01:04.338756+00', '2025-12-24 07:51:45.045028+00', 'c6eqb4f4poaz', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 58, 'jgoop2laotak', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-16 16:15:47.473478+00', '2025-12-24 07:52:06.589581+00', NULL, 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 88, '5ktadxln2wqq', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 07:52:06.590039+00', '2025-12-24 08:52:17.49575+00', 'jgoop2laotak', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 87, 'ixxwnoahfkyz', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 07:51:45.058239+00', '2025-12-24 09:07:38.825189+00', 'qskqklmgrk7m', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 90, 'lhr7qcdveaca', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 08:52:17.50685+00', '2025-12-24 09:52:09.854027+00', '5ktadxln2wqq', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 91, 'soxame3u7akc', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 09:07:38.839681+00', '2025-12-24 11:32:32.620577+00', 'ixxwnoahfkyz', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 103, '2ybyacuei2d3', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 14:33:01.217757+00', '2025-12-26 16:59:40.747974+00', 'i54ma6xyoyvt', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 104, 'l7sacv3efmqy', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 14:33:05.698549+00', '2025-12-26 17:00:47.025057+00', 'snepsgnszqsb', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 119, 'k65tzafjy3r7', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-26 16:59:40.772885+00', '2025-12-27 05:53:42.91102+00', '2ybyacuei2d3', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 93, 'kswoxvj77kyl', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 09:52:09.863387+00', '2025-12-24 11:34:17.839464+00', 'lhr7qcdveaca', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 96, '22axbc54fbqt', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 11:32:32.637314+00', '2025-12-24 12:31:10.608808+00', 'soxame3u7akc', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 97, 'luh3g5rcen5z', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 11:34:17.841151+00', '2025-12-24 12:40:05.233627+00', 'kswoxvj77kyl', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 121, 'faqchwbbbeas', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-27 05:53:42.933989+00', '2025-12-27 06:54:35.372447+00', 'k65tzafjy3r7', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 98, 'dda6g7lxpphr', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 12:31:10.636483+00', '2025-12-24 13:29:52.9815+00', '22axbc54fbqt', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 99, 'i54ma6xyoyvt', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 12:40:05.236961+00', '2025-12-24 14:33:01.193488+00', 'luh3g5rcen5z', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 102, 'snepsgnszqsb', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-24 13:29:52.992101+00', '2025-12-24 14:33:05.697827+00', 'dda6g7lxpphr', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 127, 'fkhue4mmsrl7', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-27 07:13:57.345239+00', '2025-12-27 08:13:13.748577+00', 'd467lk27yozp', '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 125, 'ghvfyplockuf', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-27 06:54:35.385313+00', '2025-12-27 09:10:19.079672+00', 'faqchwbbbeas', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 130, 'jpy4xggvcer4', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', false, '2025-12-27 09:10:19.097031+00', '2025-12-27 09:10:19.097031+00', 'ghvfyplockuf', 'f5e61774-97e5-4eaa-9fa5-2fa2fcadfed7'),
	('00000000-0000-0000-0000-000000000000', 122, '64m55nkfc6s3', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', true, '2025-12-27 05:53:53.420551+00', '2025-12-27 09:10:27.827922+00', '7epjsoqwqwsg', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 131, 'o3zd66pyf3sb', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', false, '2025-12-27 09:10:27.828348+00', '2025-12-27 09:10:27.828348+00', '64m55nkfc6s3', '5415021a-518b-41cc-abfc-fbc7f038491b'),
	('00000000-0000-0000-0000-000000000000', 135, 'plpu54gw4guk', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', true, '2025-12-27 10:55:49.525498+00', '2025-12-28 04:16:12.22547+00', 'mkzvo4n6ahsh', 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 134, '574l5lc3zrdt', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-27 10:55:49.525496+00', '2025-12-28 04:16:12.224523+00', '5nskhcn32esn', '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 137, 'mvvpq2mplqgn', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-28 04:16:12.244169+00', '2025-12-28 06:32:05.374121+00', '574l5lc3zrdt', '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 139, 'gmnwlgpkrmjf', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-28 06:32:05.389593+00', '2025-12-28 07:45:11.663801+00', 'mvvpq2mplqgn', '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 142, 'x4of5x7tc7u7', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', true, '2025-12-28 08:53:03.997602+00', '2025-12-28 10:36:49.414483+00', 'mq4qbzovnbc4', 'dd0d2dc9-81ec-4d1d-8580-2424f31d2019'),
	('00000000-0000-0000-0000-000000000000', 143, '4qg7plocfl65', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-28 08:54:03.37622+00', '2025-12-28 10:50:14.821213+00', 'd27wbnygxynb', '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 145, 'nop43xjdhd5m', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', false, '2025-12-28 10:50:14.842924+00', '2025-12-28 10:50:14.842924+00', '4qg7plocfl65', '3547c1ca-28f7-4783-b287-60a919ab516a'),
	('00000000-0000-0000-0000-000000000000', 147, '3jbqzs5mwu7i', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-28 11:21:40.422111+00', '2025-12-28 14:26:11.91215+00', NULL, 'e3c34261-252e-4653-909e-63c13796844d'),
	('00000000-0000-0000-0000-000000000000', 149, 'ldkzgqqfj7gx', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', true, '2025-12-28 14:26:11.939484+00', '2025-12-28 16:21:56.304443+00', '3jbqzs5mwu7i', 'e3c34261-252e-4653-909e-63c13796844d'),
	('00000000-0000-0000-0000-000000000000', 151, 'plgxbnmuo2tb', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', false, '2025-12-28 16:21:56.306421+00', '2025-12-28 16:21:56.306421+00', 'ldkzgqqfj7gx', 'e3c34261-252e-4653-909e-63c13796844d');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "full_name", "email", "phone", "address", "city", "created_at", "updated_at", "role", "avatar_url") VALUES
	('4c13a0b8-1430-4089-97b5-c2d7bcb0b937', 'Prakhar Katariya', 'katariyaprakhar1@gmail.com', NULL, NULL, NULL, '2025-12-12 15:48:49.491755+00', '2025-12-12 15:48:49.491755+00', 'user', 'https://lh3.googleusercontent.com/a/ACg8ocJ3EuBGiqLcutgPrbu92bDYHt6eIg5biCJ2zP8YxiamHbj_Mv5K=s96-c'),
	('3d746e2c-ca84-4fbc-ace1-88fb85094a5a', 'Prakhar2', 'katariyaprakhar2@gmail.com', NULL, NULL, NULL, '2025-12-12 15:48:49.491755+00', '2025-12-12 15:48:49.491755+00', 'user', 'https://lh3.googleusercontent.com/a/ACg8ocK2l6PB4UbqFUlDanbbOTDJT-uwQSCiRwW_uOo3O93XUlcjoA=s96-c'),
	('43f38d7e-1927-4f1c-9ac7-9ecdc78aeb2b', 'All Rounder 3', 'all3@rounder.com', NULL, NULL, NULL, '2025-12-10 16:35:21.536234+00', '2025-12-10 16:35:21.536234+00', 'worker', NULL),
	('4ddc55b7-024f-4894-baeb-edb46e8e83c7', 'Sambhav Mehta', 'sambhavm22@gmail.com', '', 'c-1 navlakha apartment c-scheme', 'Jaipur', '2025-12-12 15:48:49.491755+00', '2025-12-12 15:48:49.491755+00', 'user', 'https://lh3.googleusercontent.com/a/ACg8ocI2eNssvUVPTRRXPJKgNUn9eEtHPk4f8xvTk1noWOmGBhLgwQ=s96-c'),
	('cdefd730-73ad-454f-8836-050c0a1cd9b1', 'Sambhav Mehta', 'sambhav.mehta2210@gmail.com', '', 'c-1 navlakha apartment c-scheme', 'Jaipur', '2025-12-12 09:32:06.16687+00', '2025-12-12 09:32:06.16687+00', 'user', 'https://lh3.googleusercontent.com/a/ACg8ocIAP3dOWvqFrXYkt3JPG8BDjjkcdj6vUunkHjSi7wW8BGuTcA=s96-c'),
	('cd0ae54a-3fac-44c6-b3d4-c5f9cde92e20', NULL, NULL, NULL, NULL, NULL, '2025-12-25 06:46:50.956599+00', '2025-12-25 06:46:50.956599+00', 'user', NULL),
	('3a12fbc1-b307-415a-a8c3-d376a894f101', NULL, NULL, NULL, NULL, NULL, '2025-12-25 07:24:55.641146+00', '2025-12-25 07:24:55.641146+00', 'user', NULL),
	('809bccea-8e4f-4b79-a37f-f696b0020449', NULL, NULL, NULL, NULL, NULL, '2025-12-25 15:26:50.994993+00', '2025-12-25 15:26:50.994993+00', 'user', NULL),
	('bf26b4bb-7c5b-47a9-9427-e0970ff2df7d', NULL, 'all2@rounder.com', NULL, NULL, NULL, '2025-12-12 15:48:49.491755+00', '2025-12-12 15:48:49.491755+00', 'worker', NULL);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."addresses" ("id", "customer_id", "label", "address_line1", "address_line2", "city", "postal_code", "location", "created_at", "lat", "lng") VALUES
	('437f1eb8-c457-49c7-a128-e22795a3d66f', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', 'Home', 'c-1 navlakha apartment c-scheme', NULL, 'Jaipur', 302001, NULL, '2025-12-18 15:30:58.946+00', NULL, NULL),
	('5f4ab792-cdb8-4f9d-bda2-bcf3b60ab38a', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', 'Home', 'Sector 57', NULL, 'Gurgaon', 122001, NULL, '2025-12-24 08:09:45.541+00', NULL, NULL),
	('c391200d-8d78-4eed-9418-0e7144b4f4ac', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', 'Home', '508, kk tower', NULL, 'Jaipur', 302016, NULL, '2025-12-24 09:17:43.101+00', NULL, NULL),
	('53113eb7-03ac-4492-a22e-660e9a8c3e5c', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', 'Home', 'Sector 57', NULL, 'Gurgaon', 122001, NULL, '2025-12-24 09:53:20.269+00', NULL, NULL),
	('2dd63e9b-e6cf-47c7-922f-fd94657efa3f', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', 'Home', 'Sector 57', NULL, 'Gurgaon', 122011, NULL, '2025-12-24 12:20:38.196+00', NULL, NULL),
	('6ea1c019-4494-4c0f-b409-5559d92a2a62', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', 'Home', 'c-1 navlakha apartment c-scheme', NULL, 'Jaipur', 302001, '0101000020E6100000C0EC9E3C2C385240FA7E6ABC74133340', '2025-12-23 15:28:18.513+00', 19.076, 72.8777),
	('d32ea082-1940-42c8-8db4-d3412fe2b645', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', 'Home', 'road no 9 Vishwakarma Industrial Area', NULL, 'Jaipur', 302013, '0101000020E6100000C0EC9E3C2C385240FA7E6ABC74133340', '2025-12-24 11:06:24.386+00', 19.076, 72.8777),
	('ff636346-f25f-4522-841f-2e2e32ac3742', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', 'Home', '11 bhana mansion ', NULL, 'Jaipur Tehsil', 302005, '0101000020E61000005241EA1BBDF252403806AE3C92E23A40', '2025-12-28 07:45:42.172+00', 26.8850439, 75.7927923);


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."services" ("id", "name", "description", "base_price", "image_url", "is_active", "created_at") VALUES
	(1, 'Everyday Cleaning', 'Standard home sweeping and mopping', 200.00, '/assets/cleaning.jpg', true, '2025-12-12 15:13:24.416155+00'),
	(2, 'Laundry', 'Washing, drying and folding per hour', 150.00, '/assets/laundry.jpg', true, '2025-12-12 15:13:24.416155+00'),
	(3, 'Expert Cook', 'Home style cooking for families', 300.00, '/assets/cook.jpg', true, '2025-12-12 15:13:24.416155+00');


--
-- Data for Name: workers_public; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."workers_public" ("id", "full_name", "profile_image_url", "service_types", "rating", "total_reviews", "hourly_rate", "location", "is_verified", "bio", "created_at", "user_id", "postal_code", "verification_status", "verification_source", "verified_at", "verification_metadata") VALUES
	('682090e3-8b98-466a-9449-88f0df69b423', 'Ramesh Kumar', NULL, '{"Everyday Cleaning",Laundry}', 5.00, 0, 250.00, '0101000020E6100000C0EC9E3C2C385240FA7E6ABC74133340', true, 'Experienced reliable helper', '2025-12-12 15:13:24.416155+00', NULL, NULL, 'unverified', NULL, NULL, NULL),
	('09772f6e-cd9c-4f2c-ad51-cf242d9b365c', 'Sunita Devi', NULL, '{"Expert Cook","Everyday Cleaning"}', 5.00, 0, 350.00, '0101000020E6100000B81E85EB5138524014AE47E17A143340', true, 'Specializes in North Indian cuisine', '2025-12-12 15:13:24.416155+00', NULL, NULL, 'unverified', NULL, NULL, NULL),
	('125f9cb9-fbea-4b19-a455-212bc895b454', 'Sambhav Mehta', NULL, '{"Expert Cook"}', 5.00, 0, 200.00, '0101000020E6100000EE0EEB01B5F2524062063540AAE83A40', false, 'I have experience in cooking Indian food.', '2025-12-15 17:24:42.160222+00', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', NULL, 'unverified', NULL, NULL, NULL),
	('bf26b4bb-7c5b-47a9-9427-e0970ff2df7d', 'Sudhir Laundry', NULL, '{Laundry}', 4.90, 0, 200.00, '0101000020E61000004C378941604D5340B003E78C289D3C40', true, 'Expert laundry service with care.', '2025-12-27 09:23:33.412493+00', NULL, NULL, 'unverified', NULL, NULL, NULL),
	('cdefd730-73ad-454f-8836-050c0a1cd9b1', 'Sambhav Mehta', NULL, '{"Everyday Cleaning"}', 5.00, 0, 150.00, '0101000020E610000022193FEC12F2524035196A0615E83A40', false, 'I am a household helper and able to do household work like cleaning room, chopping vegetables etc. ', '2025-12-23 15:26:22.407732+00', NULL, '302013', 'unverified', NULL, NULL, NULL),
	('4ddc55b7-024f-4894-baeb-edb46e8e83c7', 'Sambhav Mehta', NULL, '{"Everyday Cleaning",Laundry}', 5.00, 0, 100.00, '0101000020E6100000D9FDCDD4B4F252400753A008ABE83A40', false, 'i am your perfect helper. ', '2025-12-17 09:17:48.882861+00', NULL, NULL, 'unverified', NULL, NULL, NULL),
	('4c13a0b8-1430-4089-97b5-c2d7bcb0b937', 'Prakhar Katariya', NULL, '{"Everyday Cleaning"}', 5.00, 0, 100.00, '0101000020E61000009E99603857455340F937C368B16D3C40', false, '', '2025-12-24 07:52:45.224596+00', NULL, NULL, 'unverified', NULL, NULL, NULL);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."bookings" ("id", "customer_id", "worker_id", "service_id", "address_id", "status", "scheduled_at", "duration_minutes", "total_amount", "notes", "created_at", "updated_at", "location", "rating", "review") VALUES
	('88bef970-ec52-498b-afa6-33561a7778df', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', '682090e3-8b98-466a-9449-88f0df69b423', 1, NULL, 'requested', '2025-12-13 05:30:00+00', NULL, 250.00, 'Location: bandra mumbai', '2025-12-12 15:49:59.526813+00', '2025-12-12 15:49:59.526813+00', NULL, NULL, NULL),
	('0f866e64-83cd-496b-af1f-55a73d2b0821', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', NULL, 1, NULL, 'requested', '2025-12-13 05:14:42.796+00', 60, 200.00, NULL, '2025-12-13 04:59:42.932341+00', '2025-12-13 04:59:42.932341+00', NULL, NULL, NULL),
	('47f1c278-b8eb-4550-b2ea-4cde21d40d1a', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', NULL, 1, NULL, 'requested', '2025-12-14 08:36:17.079+00', 60, 200.00, NULL, '2025-12-14 08:21:17.595089+00', '2025-12-14 08:21:17.595089+00', NULL, NULL, NULL),
	('8ef2dfdb-68c5-4925-84e2-aaa70a76d3aa', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', NULL, 1, NULL, 'requested', '2025-12-16 15:06:51.064+00', 60, 200.00, NULL, '2025-12-16 14:51:52.0924+00', '2025-12-16 14:51:52.0924+00', NULL, NULL, NULL),
	('97a88cb1-4ba3-49cb-9fdc-16e1a4877c50', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', NULL, 2, NULL, 'requested', '2025-12-17 13:48:13.111+00', 90, 225.00, NULL, '2025-12-17 13:33:13.206312+00', '2025-12-17 13:33:13.206312+00', NULL, NULL, NULL),
	('cb19b16f-4cbc-403c-910e-b02fd36fbe76', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', NULL, 1, NULL, 'requested', '2025-12-17 14:26:47.81+00', 90, 300.00, NULL, '2025-12-17 14:11:47.858151+00', '2025-12-17 14:11:47.858151+00', NULL, NULL, NULL),
	('ec16c9bb-6e74-436e-bfb1-aefcc3c7d9ac', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', NULL, 2, NULL, 'requested', '2025-12-17 15:13:07.198+00', 60, 150.00, NULL, '2025-12-17 14:58:07.342389+00', '2025-12-17 14:58:07.342389+00', NULL, NULL, NULL),
	('de57180c-4081-4291-a060-79ce95953206', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', NULL, 1, '437f1eb8-c457-49c7-a128-e22795a3d66f', 'requested', '2025-12-18 15:46:11.421+00', 90, 300.00, NULL, '2025-12-18 15:31:11.609019+00', '2025-12-18 15:31:11.609019+00', NULL, NULL, NULL),
	('f2bef09d-2abe-4830-88b8-bde67b3994dd', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', NULL, 1, '437f1eb8-c457-49c7-a128-e22795a3d66f', 'requested', '2025-12-18 16:21:57.218+00', 60, 200.00, NULL, '2025-12-18 16:06:57.368612+00', '2025-12-18 16:06:57.368612+00', NULL, NULL, NULL),
	('b0a6f574-5b8f-4c9c-adcb-ef7b235f0078', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', NULL, 1, '437f1eb8-c457-49c7-a128-e22795a3d66f', 'requested', '2025-12-19 11:22:48.487+00', 90, 300.00, NULL, '2025-12-19 11:07:48.730235+00', '2025-12-19 11:07:48.730235+00', NULL, NULL, NULL),
	('148e5442-2902-4dbc-92f4-e65f1139cf69', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', NULL, 2, '437f1eb8-c457-49c7-a128-e22795a3d66f', 'requested', '2025-12-19 11:31:15.907+00', 90, 225.00, NULL, '2025-12-19 11:16:16.10143+00', '2025-12-19 11:16:16.10143+00', NULL, NULL, NULL),
	('ad296be1-af9b-49f1-9276-c08a45e5eefe', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', NULL, 1, '6ea1c019-4494-4c0f-b409-5559d92a2a62', 'requested', '2025-12-23 15:44:02.541+00', 90, 300.00, NULL, '2025-12-23 15:29:02.61285+00', '2025-12-23 15:29:02.61285+00', NULL, NULL, NULL),
	('e7e60d0e-0f6e-496a-8c7f-62f384892fa2', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', NULL, 1, 'c391200d-8d78-4eed-9418-0e7144b4f4ac', 'requested', '2025-12-24 09:32:52.435+00', 60, 200.00, NULL, '2025-12-24 09:17:53.253862+00', '2025-12-24 09:17:53.253862+00', NULL, NULL, NULL),
	('b854201f-1e68-4c4c-9195-e8f138ae4a2d', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', NULL, 2, '53113eb7-03ac-4492-a22e-660e9a8c3e5c', 'requested', '2025-12-24 10:08:30.9+00', 60, 150.00, NULL, '2025-12-24 09:53:31.702448+00', '2025-12-24 09:53:31.702448+00', NULL, NULL, NULL),
	('3f6a0617-05b6-456e-ae69-442a640b913a', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', NULL, 1, '437f1eb8-c457-49c7-a128-e22795a3d66f', 'requested', '2025-12-24 11:08:31.441+00', 90, 300.00, NULL, '2025-12-24 10:53:31.776564+00', '2025-12-24 10:57:56.635877+00', NULL, NULL, NULL),
	('a0bfbbe8-cc2e-4357-ba97-2132f691c2bc', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', NULL, 2, 'd32ea082-1940-42c8-8db4-d3412fe2b645', 'requested', '2025-12-24 11:21:29.781+00', 90, 225.00, NULL, '2025-12-24 11:06:29.887686+00', '2025-12-24 11:06:29.887686+00', NULL, NULL, NULL),
	('87edbc95-23e3-4841-8976-a983144c358c', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', NULL, 1, '2dd63e9b-e6cf-47c7-922f-fd94657efa3f', 'requested', '2025-12-24 14:53:59.96+00', 90, 300.00, NULL, '2025-12-24 14:39:01.658089+00', '2025-12-24 14:39:01.658089+00', NULL, NULL, NULL),
	('3aca6c29-8b38-4a42-be92-45cde3649a32', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', NULL, 1, '5f4ab792-cdb8-4f9d-bda2-bcf3b60ab38a', 'requested', '2025-12-24 08:24:49.849+00', 90, 300.00, NULL, '2025-12-24 08:09:50.602229+00', '2025-12-24 13:28:56.528932+00', NULL, NULL, NULL),
	('5569fbd9-0418-406c-b596-507806e9b6e4', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', NULL, 1, '6ea1c019-4494-4c0f-b409-5559d92a2a62', 'requested', '2025-12-25 00:19:19.429+00', 60, 200.00, NULL, '2025-12-25 00:04:19.631774+00', '2025-12-25 00:04:19.631774+00', NULL, NULL, NULL),
	('80efa105-a3d9-49b5-8cc8-f72a4c3dbfdd', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', NULL, 1, '2dd63e9b-e6cf-47c7-922f-fd94657efa3f', 'requested', '2025-12-26 17:16:50.205+00', 60, 200.00, NULL, '2025-12-26 17:01:50.642029+00', '2025-12-26 17:01:50.642029+00', NULL, NULL, NULL),
	('18923684-cfc8-4b02-8320-5a13b1493002', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', NULL, 1, '6ea1c019-4494-4c0f-b409-5559d92a2a62', 'requested', '2025-12-27 06:30:07.737+00', 90, 300.00, NULL, '2025-12-27 06:15:07.915602+00', '2025-12-27 06:15:07.915602+00', NULL, NULL, NULL),
	('168dc219-e48d-4131-a33c-79f8f96a7820', '4c13a0b8-1430-4089-97b5-c2d7bcb0b937', NULL, 1, '2dd63e9b-e6cf-47c7-922f-fd94657efa3f', 'requested', '2025-12-27 06:09:38.928+00', 180, 600.00, NULL, '2025-12-27 05:54:39.047539+00', '2025-12-27 05:54:53.440833+00', NULL, NULL, NULL),
	('fa0fe5f5-6ffc-4f37-a4ef-86f2fdcaa726', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', NULL, 1, '6ea1c019-4494-4c0f-b409-5559d92a2a62', 'requested', '2025-12-28 07:23:29.82+00', 90, 300.00, NULL, '2025-12-28 07:08:29.939195+00', '2025-12-28 07:08:29.939195+00', NULL, NULL, NULL),
	('c7411187-ce45-476e-98bf-82947dff6e0f', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', NULL, 1, '6ea1c019-4494-4c0f-b409-5559d92a2a62', 'requested', '2025-12-28 07:37:27.843+00', 60, 200.00, NULL, '2025-12-28 07:22:27.957787+00', '2025-12-28 07:22:27.957787+00', NULL, NULL, NULL),
	('c7a87eee-791b-4816-af96-bd18ae728d0d', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', NULL, 2, 'ff636346-f25f-4522-841f-2e2e32ac3742', 'requested', '2025-12-28 08:00:50.589+00', 60, 150.00, NULL, '2025-12-28 07:45:50.710531+00', '2025-12-28 07:45:50.710531+00', NULL, NULL, NULL),
	('95545fe5-915a-4efa-9e15-4ac08e640d4b', '4ddc55b7-024f-4894-baeb-edb46e8e83c7', 'cdefd730-73ad-454f-8836-050c0a1cd9b1', 1, 'ff636346-f25f-4522-841f-2e2e32ac3742', 'accepted', '2025-12-28 09:19:38.18+00', 60, 200.00, NULL, '2025-12-28 09:04:38.279696+00', '2025-12-28 09:07:07.793756+00', NULL, NULL, NULL);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: otp_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."otp_verifications" ("id", "phone", "code", "expires_at", "created_at", "verified_at", "attempts") VALUES
	('44fe594b-dd9a-4261-8ffc-cd2b72478256', '+917568564423', '622363', '2025-12-25 15:11:17.491+00', '2025-12-25 15:01:18.505977+00', NULL, 0),
	('2e50d636-5d23-49a8-bf63-7bfc0e6974d9', '+917568564423', '237128', '2025-12-25 15:12:36.442+00', '2025-12-25 15:02:37.636568+00', NULL, 0),
	('87df3a43-4982-4e1f-a930-acbb88648d8c', '7568564423', '734680', '2025-12-25 15:19:21.739+00', '2025-12-25 15:09:22.395187+00', NULL, 0),
	('e02ca4da-e14e-4961-a6fe-11522ff2a5ae', '+917568564423', '135623', '2025-12-25 15:20:44.533+00', '2025-12-25 15:10:45.138375+00', '2025-12-25 15:13:10.795+00', 0),
	('add457cf-6341-4529-a70c-239be6a4c8fc', '+917611953225', '368603', '2025-12-25 15:24:00.563+00', '2025-12-25 15:14:01.165318+00', '2025-12-25 15:14:47.23+00', 0),
	('fa2c1ca9-c7ae-4d3f-9c23-8eb8b1a7b27c', '+17656762485', '636379', '2025-12-25 15:35:56.38+00', '2025-12-25 15:25:57.50223+00', '2025-12-25 15:26:50.782+00', 0),
	('c2a83f32-4ff9-4daa-ba95-7a932235b0b3', '+17656762485', '135102', '2025-12-25 15:40:02.679+00', '2025-12-25 15:30:03.256118+00', '2025-12-25 15:30:37.068+00', 0),
	('e118d534-e023-49db-9418-ea223a7ec7f5', '+17656762485', '636154', '2025-12-25 15:41:41.929+00', '2025-12-25 15:31:42.472025+00', '2025-12-25 15:32:50.416+00', 0);


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: zip_centroids; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."zip_centroids" ("postal_code", "location") VALUES
	('400001', '0101000020E6100000287E8CB96B35524079E9263108EC3240'),
	('400050', '0101000020E61000005B423EE8D934524073D712F2410F3340'),
	('122001', '0101000020E6100000B6847CD0B34153401283C0CAA1753C40');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 151, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."services_id_seq"', 3, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict hkprEm6VQLVwEQ86CoYX1FxXAd5fn3apbdb739d7s0Vw7d8E2D5d3E6gKzVZXV4

RESET ALL;
