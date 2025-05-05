const config = {
  logo: "facebook.js",
  title: "facebook.js",
  project: {
    link: "https://github.com/leftmove/facebook.js",
  },
  docsRepositoryBase:
    "https://github.com/leftmove/facebook.js/blob/main/website",
  useNextSeoProps() {
    return {
      titleTemplate: "%s – facebook.js",
    };
  },
  search: true,
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  primaryHue: 210,
  navigation: {
    prev: true,
    next: true,
  },
};

export default config;
