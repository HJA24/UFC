data {
    int<lower=2> N;
    array[N] int<lower=0, upper=1> y;
    int K;                                         // number of variables
    matrix[N, K] X;
}

parameters {
    vector[K] z;
}

transformed parameters {
    vector[K] beta = mu + sigma * z;
    vector[N] eta  = X * beta;
}

model {
    // priors
    mu    ~ normal(0, 2);
    sigma ~ normal(0, 2);
    z     ~ std_normal();

    // likelihood
    y ~ bernoulli_logit(eta);
}

generated quantities {
    array[N] int<lower=0, upper=1> y_hat = bernoulli_logit_rng(eta);
}