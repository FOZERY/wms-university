import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';

export const authProviders = [AuthService];
export const authControllers = [AuthController];
