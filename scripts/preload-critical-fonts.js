// Critical font preloading script
// This ensures fonts are loaded with proper priorities
(function() {
  if ('fonts' in document) {
    // Preload Inter font family
    const interFont = new FontFace(
      'Inter',
      'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2)',
      {
        weight: '400 600',
        style: 'normal',
        display: 'swap'
      }
    );
    
    interFont.load().then(function(loadedFont) {
      document.fonts.add(loadedFont);
    }).catch(function(error) {
      console.warn('Font loading failed:', error);
    });
  }
})();
