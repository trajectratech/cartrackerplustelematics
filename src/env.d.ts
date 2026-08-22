/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { User } from "@supabase/supabase-js";
import type { ServerClient } from "@supabase/ssr";

declare namespace App {
	interface Locals {
		user: User | null;
		supabase: ServerClient<any> | null;
	}
}
