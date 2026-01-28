import logging
import numpy as np
import arviz as az
import matplotlib.pyplot as plt
from typing import Any, Dict, List, Union


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def check_divergences(fit: az.InferenceData, **kwargs: Any) -> bool:
    n_chains = kwargs.get('n_chains', 4)
    n_draws = kwargs.get('n_draws', 500)

    n_div = np.sum(fit.sample_stats['diverging'].values, axis=1)
    diverging = np.all(n_div != 0)

    if diverging:
        for c in range(n_chains):
            logger.warning(f"chain #{c + 1}: {n_div[c]} of {n_draws} transitions ({n_div[c] / n_draws:.1%}) diverged")

        return False

    return True


def check_acceptance_rate(fit: az.InferenceData, adapt_target: float=0.801, **kwargs: Any) -> bool:
    n_chains = kwargs.get('n_chains', 4)

    ar = np.mean(fit.sample_stats['acceptance_rate'].values, axis=1)
    within_thresh = True

    for c in range(n_chains):
        if ar[c] < 0.9 * adapt_target:
            logger.warning(f"chain #{c + 1}: average acceptance rate ({ar[c]:.1%}) is smaller than threshold ({0.9 * adapt_target:.1%})")
            within_thresh = False

    return within_thresh


def check_tree_depth(fit: az.InferenceData, max_treedepth: int=10, **kwargs: Any) -> bool:
    n_chains = kwargs.get('n_chains', 4)
    n_draws = kwargs.get('n_draws', 500)

    td = fit.sample_stats['tree_depth'].values
    n_td = np.sum(td >= max_treedepth, axis=1)
    saturated = np.all(n_td != 0)

    if saturated:
        for c in range(n_chains):
            logger.warning(f"chain #{c + 1}: {n_td[c]:.0f} of {n_draws} transitions ({n_td[c] / n_draws:.1%}) saturated the maximum treedepth")

        return False

    return True


def check_efmi(fit: az.InferenceData, threshold: float=0.2, **kwargs: Any) -> bool:
    n_chains = kwargs.get('n_chains', 4)
    n_draws = kwargs.get('n_draws', 500)

    within_thresh = True
    energies = fit.sample_stats['energy']

    for c in range(n_chains):
        numer = sum((energies[c][i] - energies[c][i - 1]) ** 2 for i in range(1, n_draws)) / n_draws
        denom = np.var(energies[c])
        bfmi = numer / denom

        if bfmi < threshold:
            logger.warning(f"chain #{c + 1}: EBFMI ({bfmi:.1%}) is smaller than threshold ({threshold:.1%})")
            within_thresh = False

    return within_thresh


def check_ess(fit: az.InferenceData, parameters=Union[str, List[str]], total_ess_rule_of_thumb: int=100, fractional_ess_rule_of_thumb: float=0.001, **kwargs: Any) -> bool:
    n_chains = kwargs.get('n_chains', 4)
    n_draws = kwargs.get('n_draws', 500)

    total_ess_rule_of_thumb *= n_chains

    ess = az.ess(
        data=fit,
        var_names=parameters,
        method='bulk'
    )

    tail_ess = az.ess(
        data=fit,
        var_names=parameters,
        method='tail'
    )

    _, ess = az.sel_utils.xarray_to_ndarray(
        data=ess,
        var_names=parameters,
        combined=True
    )

    _, tail_ess = az.sel_utils.xarray_to_ndarray(
        data=tail_ess,
        var_names=parameters,
        combined=True
    )

    ess = ess.squeeze()
    tail_ess = tail_ess.squeeze()
    fractional_ess = ess / n_chains / n_draws
    fractional_tail_ess = tail_ess / n_chains / n_draws

    effective = (
            np.all(ess[~np.isnan(ess)] > total_ess_rule_of_thumb) and
            np.all(fractional_ess[~np.isnan(ess)] > fractional_ess_rule_of_thumb) and
            np.all(tail_ess[~np.isnan(tail_ess)] > total_ess_rule_of_thumb) and
            np.all(fractional_tail_ess[~np.isnan(tail_ess)] > fractional_ess_rule_of_thumb)
    )

    if not effective:
        for parameter, e, f, te, tf in zip(parameters, ess, fractional_ess, tail_ess, fractional_tail_ess):
            if e < total_ess_rule_of_thumb:
                logger.warning(f"ESS of '{parameter}' ({e:.0f}) is smaller than threshold ({total_ess_rule_of_thumb})")

            if f < fractional_ess_rule_of_thumb:
                logger.warning(f"ESS / iter of '{parameter}' ({f:.2%}) is smaller than threshold ({fractional_ess_rule_of_thumb:.2%})")

            if te < total_ess_rule_of_thumb:
                logger.warning(f"tail-ESS of '{parameter}' ({te:.0f}) is smaller than threshold ({total_ess_rule_of_thumb})")

            if tf < fractional_ess_rule_of_thumb:
                logger.warning(f"ESS / iter of '{parameter}' ({tf:.2%}) is smaller than threshold ({fractional_ess_rule_of_thumb:.2%})")

        return False

    return True


def check_mcse(fit: az.InferenceData, parameters=Union[str, List[str]], msce_rule_of_thumb: float=0.065) -> bool:
    mcse = az.mcse(
        data=fit,
        var_names=parameters
    )

    std = fit.posterior.std(dim=['chain', 'draw'])

    _, mcse = az.sel_utils.xarray_to_ndarray(
        data=mcse,
        var_names=parameters,
        combined=True
    )

    _, std = az.sel_utils.xarray_to_ndarray(
        data=std,
        var_names=parameters,
        combined=True
    )

    mcse = mcse.squeeze()
    std = std.squeeze()
    effective = np.all(mcse[~np.isnan(mcse)] <= std * msce_rule_of_thumb)

    if not effective:
        logger.warning(
            """
            """
        )

    return effective


def check_rhats(fit: az.InferenceData, parameters=Union[str, List[str]], rhat_rule_of_thumb: float=1.1) -> bool:
    rhats = az.rhat(
        data=fit,
        var_names=parameters,
        method='rank'
    )

    _, rhats = az.sel_utils.xarray_to_ndarray(
        data=rhats,
        var_names=parameters,
        combined=True
    )

    rhats = rhats.squeeze()
    converged = np.all(rhats[~np.isnan(rhats)] <= rhat_rule_of_thumb)

    if not converged:
        logger.warning("R-hats larger than 1.1 suggests that at least one of the Markov chains has not reached an equilibrium")
        return False

    return True


def check_diagnostics(fit: az.InferenceData, parameters=Union[str, List[str]]) -> Dict:
    n_chains = len(fit.sample_stats['chain'])
    n_draws = len(fit.sample_stats['draw'])

    divergences = check_divergences(
        fit=fit,
        n_chains=n_chains,
        n_draws=n_draws
    )

    acceptance_rate = check_acceptance_rate(
        fit=fit,
        n_chains=n_chains,
        n_draws=n_draws
    )

    tree_depth = check_tree_depth(
        fit=fit,
        n_chains=n_chains,
        n_draws=n_draws
    )

    efmi = check_efmi(
        fit=fit,
    )

    ess = check_ess(
        fit=fit,
        parameters=parameters,
        n_chains=n_chains,
        n_draws=n_draws
    )

    rhats = check_rhats(
        fit=fit,
        parameters=parameters
    )

    return {
        'no_divergences': divergences,
        'acceptance_rate_within_thresh': acceptance_rate,
        'tree_depth_not_saturated': tree_depth,
        'efmi_within_thresh': efmi,
        'ess_large_enough': ess,
        'rhats_converged': rhats
    }


def plot_ppc(fit: az.InferenceData, pairs: Dict) -> None:
    for (obs, pp) in pairs.items():
        fig, ax = plt.subplots(1, figsize=(10, 6))

        az.plot_ppc(
            data=fit,
            kind='cumulative',
            data_pairs={obs: pp},
            var_names=[obs],
            ax=ax
        )

        x_max = int(fit.observed_data[obs].max()) + 1

        ax.set_xlim([0, x_max])
        ax.spines[['left', 'right', 'top']].set_visible(False)
        ax.get_yaxis().set_visible(False)

        plt.legend(loc='center right')
        plt.show()
