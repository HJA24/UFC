functions {
    real induced_dirichlet_lpdf(vector c, vector alpha, real phi) {
        int K = num_elements(c) + 1;
        vector[K - 1] sigma = inv_logit(phi - c);
        vector[K] p;
        matrix[K, K] J = rep_matrix(0, K, K);

        // induced ordinal probabilities
        for (k in 2:(K - 1)) {
            p[k] = sigma[k - 1] - sigma[k];
        }

        p[1] = 1 - sigma[1];
        p[K] = sigma[K - 1];

        // baseline column of Jacobian
        for (k in 1:K) {
            J[k, 1] = 1;
        }

        // Diagonal entries of Jacobian
        for (k in 2:K) {
            real rho = sigma[k - 1] * (1 - sigma[k - 1]);
            J[k, k] = - rho;
            J[k - 1, k] = rho;
        }

        return dirichlet_lpdf(p | alpha) + log_determinant(J);
    }
}

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
    ordered[Y - 1] cut_points;
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
    L_Omega ~ lkj_corr_cholesky(2.0);
    to_vector(alpha) ~ std_normal();

    // likelihood
    cut_points ~ induced_dirichlet([1, 2.5, 10, 10, 2.5, 1]', 0);
    y ~ ordered_logistic(lambda, cut_points);
}

generated quantities {
    array[N] int<lower=1, upper=Y> y_hat;

    for (n in 1:N) {
        y_hat[n] = ordered_logistic_rng(lambda[n], cut_points);
    }
}