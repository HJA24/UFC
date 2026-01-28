export interface LoginRequestDto {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponseDto {
  token: string;
}

