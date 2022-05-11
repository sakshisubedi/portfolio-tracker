/**
 * Fetch cummulative returns at any point of time of a particular portfolio.
 * @path {GET} /returns
 * @response {String} success is true for successful completion of request
 * @response {String} message is successful if the request completes successfully and contains the error message in case of unsuccessful execution
 * @response {String} data fetch cummulative returns
*/

const fetchReturns = ({ $config, $env, $models  }) => {
    return async (req, res, next) => {
        try {
            const securities = await $models.portfolio.find({ quantity: { $ne: 0 } }).select('-_id -__v');
            const returns = securities.reduce((acc, security) => acc + ((100 - security.averageBuyPrice) * security.quantity), 0);
            return res.status(200).json({
                success: true,
                message: 'success',
                data: returns
            })
        } catch (error) {
            next(error);
        }
    }
}

module.exports = {
    fetchReturns
}