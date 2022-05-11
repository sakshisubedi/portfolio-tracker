/**
 * Fetch aggregate view of all securities in the portfolio with its final quantity and average buy price.
 * @path {GET} /portfolio
 * @response {String} success is true for successful completion of request
 * @response {String} message is successful if the request completes successfully and contains the error message in case of unsuccessful execution
 * @response {String} data fetch aggregate view of portfolio
*/

const fetchPortfolios = ({ $config, $env, $models  }) => {
    return async (req, res, next) => {
        try {
            const portfolio = await $models.portfolio.find().select('-_id -__v');
            return res.status(200).json({
                success: true,
                message: 'success',
                data: portfolio
            })
        } catch (error) {
            next(error);
        }
    }
}

module.exports = {
    fetchPortfolios
}