const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withCmakeObjectPathMax(config) {
  return withAppBuildGradle(config, (config) => {
    const marker = 'arguments "-DCMAKE_OBJECT_PATH_MAX=200"';
    const contents = config.modResults.contents;

    if (contents.includes(marker)) return config;

    const anchor = '    defaultConfig {\n';
    if (!contents.includes(anchor)) {
      throw new Error('Could not find defaultConfig in android/app/build.gradle.');
    }

    config.modResults.contents = contents.replace(
      anchor,
      `${anchor}        externalNativeBuild {\n            cmake {\n                ${marker}\n            }\n        }\n`,
    );
    return config;
  });
};
