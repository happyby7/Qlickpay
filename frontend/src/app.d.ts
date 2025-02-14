declare global {
	namespace App {
		interface Locals {
			user: import('$lib/auth').SessionValidationResult['user'];
			session: import('$lib/auth').SessionValidationResult['session'];
		}
	}
}

export {};
