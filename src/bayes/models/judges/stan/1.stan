data {
    int<lower=2> N;
    array[N] int<lower=0, upper=1> y;
    int K;                                         // number of variables
    matrix[N, K] X;
}

parameters {
    vector[K] beta;
}

transformed parameters {
    vector[N] eta = X * beta;
}

model {
    beta ~ normal(0, 10);
    y ~ bernoulli_logit(eta);
}

generated quantities {
    array[N] int<lower=0, upper=1> y_hat = bernoulli_logit_rng(eta);
}