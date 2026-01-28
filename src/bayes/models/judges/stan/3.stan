data {
    int<lower=0> N;
    int<lower=1> K;                             // number of predictors
    int<lower=2> Y;                             // number of scores {7-10, 8-10, 9-10, 10-9, 10-8, 10-7}}
    int<lower=1> J;                             // number of judges
    matrix[N, K] X;                             // covariates
    array[N] int<lower=1, upper=J> jj;          // judge idx
    array[N] int<lower=1, upper=Y> y;
}

parameters {
    vector[K] mu;
    vector<lower=0,upper=pi()/2>[K] tau_unif;
    matrix[K, J] alpha;
    cholesky_factor_corr[K] L_Omega;
    ordered[Y - 1] c;
}

transformed parameters {
    vector[N] lambda;
    matrix[K, J] beta;
    vector<lower=0>[K] tau;

    for (k in 1:K) {
        tau[k] = 2.5 * tan(tau_unif[k]);
    }

    for (j in 1:J) {
        beta[, j] = mu + (diag_pre_multiply(tau, L_Omega) * alpha[, j]);
    }

    for (n in 1:N) {
        lambda[n] = X[n, ] * beta[, jj[n]];
    }
}

model {
    // priors

    mu ~ normal(0, 5);
    tau_unif ~ uniform(0,pi()/2)
    L_Omega  ~ lkj_corr_cholesky(2.0);
    to_vector(alpha) ~ std_normal();

    // likelihood
    c ~ normal(0, 10);
    y ~ ordered_logistic(lambda, c);
}

generated quantities {
    array[N] int<lower=1, upper=Y> y_hat;

    for (n in 1:N) {
        y_hat[n] = ordered_logistic_rng(lambda[n], c);
    }
}