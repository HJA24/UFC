export interface VerifyAccountRequestDto {
  email: string;
  otp: string;
}

export interface VerifyAccountResponseDto {
  token: string;
}
