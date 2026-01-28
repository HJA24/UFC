functions {
    real gamma_alt_lpdf(real x, real log_mu, real psi) {
        real mu = exp(log_mu);
        real c = exp(psi);
        return gamma_lpdf(x | inv(c), inv(mu * c));
    }

    real gamma_alt_rng(real log_mu, real psi) {
        real mu = exp(log_mu);
        real c = exp(psi);
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

parameters {
    real gamma;
    real lambda_att;
    real lambda_def;
    real psi_rate;
    real psi_accuracy;
    real psi_time;
}

model {
    // priors
    gamma      ~ normal(2.5, 2.5 / 2.57);
    lambda_att ~ std_normal();
    lambda_def ~ std_normal();
    psi_rate     ~ exp_half_normal(2 / 2.57);
    psi_accuracy ~ exp_half_normal(2 / 2.57);
    psi_time     ~ exp_half_normal(2 / 2.57);
}

generated quantities {
    int<lower=0> y_hat;
    int<lower=0, upper=10> n_hat;
    real<lower=0> r_hat;

    y_hat = neg_binomial_alt_rng(gamma + lambda_att - lambda_def, psi_rate);
    n_hat = beta_binomial_alt_rng(10, gamma + lambda_att - lambda_def, psi_accuracy)
    r_hat = gamma_alt_rng(gamma + lambda_att - lambda_def, psi_time)
}
