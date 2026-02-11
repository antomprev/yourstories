// Configuration for optimizing asset bundling and splash screen

module.exports = {
    // Optimized asset bundling settings
    assetBundle: {
        minify: true,
        compress: true,
        splitChunks: {
            chunks: 'all',
            minSize: 20000,
            maxSize: 40000,
            minChunks: 1,
            maxAsyncRequests: 5,
            maxInitialRequests: 3
        }
    },
    // Splash screen configuration
    splashScreen: {
        image: 'path/to/splash-image.png',
        backgroundColor: '#ffffff',
        duration: 3000 // duration in ms
    }
};