functions {
    real gamma_alt_lpdf(real x, real log_mu, real psi) {
        real mu = exp(log_mu);
        real c  = exp(psi);
        return gamma_lpdf(x | inv(c), inv(mu * c));
    }

    real gamma_alt_rng(real log_mu, real psi) {
        real mu = exp(log_mu);
        real c  = exp(psi);
        return gamma_rng(inv(c), inv(mu * c));
    }

    real neg_binomial_alt_lpmf(int n, real log_mu, real psi) {
        real c = exp(-psi);
        return neg_binomial_2_log_lpmf(n | log_mu, c);
    }

    int neg_binomial_alt_rng(real log_mu, real psi) {
        real c = exp(-psi);
        return neg_binomial_2_log_rng(log_mu, c);
    }

    real beta_binomial_alt_lpmf(int n, int N, real logit_p, real psi) {
        real p = inv_logit(logit_p);
        real c = exp(-psi);
        return beta_binomial_lpmf(n | N, c * p, c * (1 - p));
    }

    int beta_binomial_alt_rng(int N, real logit_p, real psi) {
        real p = inv_logit(logit_p);
        real c = exp(-psi);
        return beta_binomial_rng(N, c * p, c * (1 - p));
    }

    real exp_half_normal_lpdf(real x, real tau) {
        return log2() + normal_lpdf(exp(x) | 0, tau) + x;
    }
}

data {
    int<lower=0> N;
    int<lower=0> n_fighters;
    array[N] int<lower=1, upper=n_fighters> blue;
    array[N] int<lower=1, upper=n_fighters> red;

    // striking-rate
    int<lower=1> K1;
    array[2, K1, N] int<lower=0>  y1;
    array[2, K1, N] real<lower=0> T1;

    // grappling-rate
    int<lower=1> K2;
    array[2, K2, N] int<lower=0>  y2;
    array[2, K2, N] real<lower=0> T2;

    // striking accuracy
    int<lower=1> K3;
    array[2, K3, N] int<lower=0> n3;
    array[2, K3, N] int<lower=0> N3;

    // knockdowns and knockouts
    int<lower=1> K4;
    array[2, K4, N] int<lower=0> n4;
    array[2, K4, N] int<lower=0> N4;

    // grappling accuracy
    int<lower=1> K5;
    array[2, K5, N] int<lower=0> n5;
    array[2, K5, N] int<lower=0> N5;

    // strike target
    int<lower=1> K6;
    array[2, K6, N] int<lower=0> n6;
    array[2, K6, N] int<lower=0> N6;
}

transformed data {
    int K  = K1 + K2 + K3 + K4 + K5 + K6;

    int I2 = 2 * K1;
    int I3 = 2 * (K1 + K2);
    int I4 = 2 * (K1 + K2 + K3);
    int I5 = 2 * (K1 + K2 + K3 + K4);
    int I6 = 2 * (K1 + K2 + K3 + K4 + K5);
    int I7 = 2 * (K1 + K2 + K3 + K4 + K5 + K6);
}

parameters {
    array[K] real gamma;
    matrix[2 * K, n_fighters - 1] lambda_free;
    array[K] real psi;
}

transformed parameters {
    matrix[2 * K, n_fighters] lambda;
    lambda[, 1]  = zeros_vector(2 * K);
    lambda[, 2:] = lambda_free;

    // strike-rate
    matrix[K1, N] eta1_blue;
    matrix[K1, N] eta1_red;

    // grappling-rate
    matrix[K2, N] eta2_blue;
    matrix[K2, N] eta2_red;

    // strike accuracy
    matrix[K3, N] alpha3_blue;
    matrix[K3, N] alpha3_red;

    // knockdowns and knockouts
    matrix[K4, N] alpha4_blue;
    matrix[K4, N] alpha4_red;

    // grappling accuracy
    matrix[K5, N] alpha5_blue;
    matrix[K5, N] alpha5_red;

    // strike target
    matrix[K6, N] alpha6_blue;
    matrix[K6, N] alpha6_red;

    for (n in 1:N) {
        int b = blue[n];
        int r = red[n];

        vector[K1] lambda_att1_blue = lambda[1: K1, b];
        vector[K1] lambda_att1_red  = lambda[1: K1, r];
        vector[K1] lambda_def1_blue = lambda[K1 + 1:I2, b];
        vector[K1] lambda_def1_red  = lambda[K1 + 1:I2, r];

        vector[K2] lambda_att2_blue = lambda[I2 + 1:I2 + K2, b];
        vector[K2] lambda_att2_red  = lambda[I2 + 1:I2 + K2, r];
        vector[K2] lambda_def2_blue = lambda[I2 + K2 + 1:I3, b];
        vector[K2] lambda_def2_red  = lambda[I2 + K2 + 1:I3, r];

        vector[K3] lambda_att3_blue = lambda[I3 + 1:I3 + K3, b];
        vector[K3] lambda_att3_red  = lambda[I3 + 1:I3 + K3, r];
        vector[K3] lambda_def3_blue = lambda[I3 + K3 + 1:I4, b];
        vector[K3] lambda_def3_red  = lambda[I3 + K3 + 1:I4, r];

        vector[K4] lambda_att4_blue = lambda[I4 + 1:I4 + K4, b];
        vector[K4] lambda_att4_red  = lambda[I4 + 1:I4 + K4, r];
        vector[K4] lambda_def4_blue = lambda[I4 + K4 + 1:I5, b];
        vector[K4] lambda_def4_red  = lambda[I4 + K4 + 1:I5, r];

        vector[K5] lambda_att5_blue = lambda[I5 + 1:I5 + K5, b];
        vector[K5] lambda_att5_red  = lambda[I5 + 1:I5 + K5, r];
        vector[K5] lambda_def5_blue = lambda[I5 + K5 + 1:I6, b];
        vector[K5] lambda_def5_red  = lambda[I5 + K5 + 1:I6, r];

        vector[K6] lambda_att6_blue = lambda[I6 + 1:I6 + K6, b];
        vector[K6] lambda_att6_red  = lambda[I6 + 1:I6 + K6, r];
        vector[K6] lambda_def6_blue = lambda[I6 + K6 + 1:I7, b];
        vector[K6] lambda_def6_red  = lambda[I6 + K6 + 1:I7, r];

        // strike-rate
        for (k in 1:K1) {
            real gamma_k = gamma[k]; 
            
            if (T1[1, k, n] > 0) {
                eta1_blue[k, n] = gamma_k + log(T1[1, k, n]) + lambda_att1_blue[k] - lambda_def1_red[k];
            } else {
                eta1_blue[k, n] = -1;
            }

            if (T1[2, k, n] > 0) {
                eta1_red[k, n] = gamma_k + log(T1[2, k, n]) + lambda_att1_red[k] - lambda_def1_blue[k];
            } else {
                eta1_red[k, n] = -1;
            }
        }

        // grappling-rate
        for (k in 1:K2) {
            real gamma_k = gamma[K1 + k]; 
                    
            if (T2[1, k, n] > 0) {
                eta2_blue[k, n] = gamma_k + log(T2[1, k, n]) + lambda_att2_blue[k] - lambda_def2_red[k];
            } else {
                eta2_blue[k, n] = -1;
            }

            if (T2[2, k, n] > 0) {
                eta2_red[k, n] = gamma_k + log(T2[2, k, n]) + lambda_att2_red[k] - lambda_def2_blue[k];
            } else {
                eta2_red[k, n] = -1;
            }
        }

        // strike accuracy
        for (k in 1:K3) {
            real gamma_k = gamma[K1 + K2 + k]; 
                    
            if (N3[1, k, n] >= n3[1, k, n]) {
                alpha3_blue[k, n] = gamma_k + lambda_att3_blue[k] - lambda_def3_red[k];
            } else {
                alpha3_blue[k, n] = -1;
            }

            if (N3[2, k, n] >= n3[2, k, n]) {
                alpha3_red[k, n] = gamma_k + lambda_att3_red[k] - lambda_def3_blue[k];
            } else {
                alpha3_red[k, n] = -1;
            }
        }

        // knockout and knockdown 
        for (k in 1:K4) {
            real gamma_k = gamma[K1 + K2 + K3 + k]; 
                    
            if (N4[1, k, n] >= n4[1, k, n]) {
                alpha4_blue[k, n] = gamma_k + lambda_att4_blue[k] - lambda_def4_red[k];
            } else {
                alpha4_blue[k, n] = -1;
            }

            if (N4[2, k, n] >= n4[2, k, n]) {
                alpha4_red[k, n] = gamma_k + lambda_att4_red[k] - lambda_def4_blue[k];
            } else {
                alpha4_red[k, n] = -1;
            }
        }
        
        // grappling accuracy
        for (k in 1:K5) {
            real gamma_k = gamma[K1 + K2 + K3 + K4 + k]; 
                    
            if (N5[1, k, n] >= n5[1, k, n]) {
                alpha5_blue[k, n] = gamma_k + lambda_att5_blue[k] - lambda_def5_red[k];
            } else {
                alpha5_blue[k, n] = -1;
            }

            if (N5[2, k, n] >= n5[2, k, n]) {
                alpha5_red[k, n] = gamma_k + lambda_att5_red[k] - lambda_def5_blue[k];
            } else {
                alpha5_red[k, n] = -1;
            }
        }
        
        // strike target
        for (k in 1:K6) {
            real gamma_k = gamma[K1 + K2 + K3 + K4 + K5 + k];
                    
            if (N6[1, k, n] > 0) {
                alpha6_blue[k, n] = gamma_k + lambda_att6_blue[k] - lambda_def6_red[k];
            } else {
                alpha6_blue[k, n] = -1;
            }

            if (N6[2, k, n] > 0) {
                alpha6_red[k, n] = gamma_k + lambda_att6_red[k] - lambda_def6_blue[k];
            } else {
                alpha6_red[k, n] = -1;
            }
        }
    }
}

model {
    // priors
    gamma                  ~ normal(2.5, 2.5 / 2.57);
    to_vector(lambda_free) ~ std_normal();

    for (k in 1:K) {
      psi[k] ~ exp_half_normal(2 / 2.57);
    }

    // observational model
    for (n in 1:N) {

        // strike-rate
        for (k in 1:K1) {
            if (T1[1, k, n] > 0) {
                y1[1, k, n] ~ neg_binomial_alt(eta1_blue[k, n], psi[k]);
            }

            if (T1[2, k, n] > 0) {
                y1[2, k, n] ~ neg_binomial_alt(eta1_red[k, n], psi[k]);
            }
        }

        // grappling rate
        for (k in 1:K2) {
            if (T2[1, k, n] > 0) {
                y2[1, k, n] ~ neg_binomial_alt(eta2_blue[k, n], psi[K1 + k]);
            }

            if (T2[2, k, n] > 0) {
                y2[2, k, n] ~ neg_binomial_alt(eta2_red[k, n], psi[K1 + k]);
            }
        }

        // strike accuracy
        for (k in 1:K3) {
            if (N3[1, k, n] >= n3[1, k, n]) {
                n3[1, k, n] ~ beta_binomial_alt(N3[1, k, n], alpha3_blue[k, n], psi[K1 + K2 + k]);
            }

            if (N3[2, k, n] >= n3[2, k, n]) {
                n3[2, k, n] ~ beta_binomial_alt(N3[2, k, n], alpha3_red[k, n], psi[K1 + K2 + k]);
            }
        }

        // knockdowns and knockouts
        for (k in 1:K4) {
            if (N4[1, k, n] >= n4[1, k, n]) {
                n4[1, k, n] ~ beta_binomial_alt(N4[1, k, n], alpha4_blue[k, n], psi[K1 + K2 + K3 + k]);
            }

            if (N4[2, k, n] >= n4[2, k, n]) {
                n4[2, k, n] ~ beta_binomial_alt(N4[2, k, n], alpha4_red[k, n], psi[K1 + K2 + K3 + k]);
            }
        }
        
        // grappling accuracy
        for (k in 1:K5) {
            if (N5[1, k, n] >= n5[1, k, n]) {
                n5[1, k, n] ~ beta_binomial_alt(N5[1, k, n], alpha5_blue[k, n], psi[K1 + K2 + K3 + K4 + k]);
            }

            if (N5[2, k, n] >= n5[2, k, n]) {
                n5[2, k, n] ~ beta_binomial_alt(N5[2, k, n], alpha5_red[k, n], psi[K1 + K2 + K3 + K4 + k]);
            }
        }
        
        // strike target
        for (k in 1:K6) {
            if (N6[1, k, n] > 0) {
                n6[1, k, n] ~ beta_binomial_alt(N6[1, k, n], alpha6_blue[k, n], psi[K1 + K2 + K3 + K4 + K5 + k]);
            }

            if (N6[2, k, n] > 0) {
                n6[2, k, n] ~ beta_binomial_alt(N6[2, k, n], alpha6_red[k, n], psi[K1 + K2 + K3 + K4 + K5 + k]);
            }
        }
    }
}

generated quantities {
    array[2, K1, N] int<lower=-1> y1_hat;
    array[2, K2, N] int<lower=-1> y2_hat;
    array[2, K3, N] int<lower=-1> n3_hat;
    array[2, K4, N] int<lower=-1> n4_hat;
    array[2, K5, N] int<lower=-1> n5_hat;
    array[2, K6, N] int<lower=-1> n6_hat;

    for (n in 1:N) {
        // strike-rate
        for (k in 1:K1) {
            if (T1[1, k, n] > 0) {
                y1_hat[1, k, n] = neg_binomial_alt_rng(eta1_blue[k, n], psi[k]);
            } else {
                y1_hat[1, k, n] = -1;
            }

            if (T1[2, k, n] > 0) {
                y1_hat[2, k, n] = neg_binomial_alt_rng(eta1_red[k, n], psi[k]);
            } else {
                y1_hat[2, k, n] = -1;
            }
        }

        // grappling rate
        for (k in 1:K2) {
            if (T2[1, k, n] > 0) {
                y2_hat[1, k, n] = neg_binomial_alt_rng(eta2_blue[k, n], psi[K1 + k]);
            } else {
                y2_hat[1, k, n] = -1;
            }

            if (T2[2, k, n] > 0) {
                y2_hat[2, k, n] = neg_binomial_alt_rng(eta2_red[k, n], psi[K1 + k]);
            } else {
                y2_hat[2, k, n] = -1;
            }
        }

        // strike accuracy
        for (k in 1:K3) {
            n3_hat[1, k, n] = beta_binomial_alt_rng(N3[1, k, n], alpha3_blue[k, n], psi[K1 + K2 + k]);
            n3_hat[2, k, n] = beta_binomial_alt_rng(N3[2, k, n], alpha3_red[k, n],  psi[K1 + K2 + k]);
        }

        // knockdowns and knockouts
        for (k in 1:K4) {
            n4_hat[1, k, n] = beta_binomial_alt_rng(N4[1, k, n], alpha4_blue[k, n], psi[K1 + K2 + K3 + k]);
            n4_hat[2, k, n] = beta_binomial_alt_rng(N4[2, k, n], alpha4_red[k, n],  psi[K1 + K2 + K3 + k]);
        }

        // grappling accuracy
        for (k in 1:K5) {
            n5_hat[1, k, n] = beta_binomial_alt_rng(N5[1, k, n], alpha5_blue[k, n], psi[K1 + K2 + K3 + K4 + k]);
            n5_hat[2, k, n] = beta_binomial_alt_rng(N5[2, k, n], alpha5_red[k, n],  psi[K1 + K2 + K3 + K4 + k]);
        }

        // strike target
        for (k in 1:K6) {
            n6_hat[1, k, n] = beta_binomial_alt_rng(N6[1, k, n], alpha6_blue[k, n], psi[K1 + K2 + K3 + K4 + K5 + k]);
            n6_hat[2, k, n] = beta_binomial_alt_rng(N6[2, k, n], alpha6_red[k, n],  psi[K1 + K2 + K3 + K4 + K5 + k]);
        }
    }
}
