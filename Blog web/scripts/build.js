// Build Script - Generates sitemap and RSS feed
const SitemapGenerator = require('./generate-sitemap');
const RSSGenerator = require('./generate-rss');

class BuildScript {
    async build() {
        console.log('🔨 Building blog...\n');
        
        try {
            // Generate sitemap
            console.log('📍 Generating sitemap...');
            const sitemapGenerator = new SitemapGenerator();
            await sitemapGenerator.generateSitemap();
            
            // Generate RSS feed
            console.log('📡 Generating RSS feed...');
            const rssGenerator = new RSSGenerator();
            await rssGenerator.generateRSS();
            
            console.log('\n🎉 Build completed successfully!');
            console.log('✅ Sitemap: sitemap.xml');
            console.log('✅ RSS Feed: rss.xml');
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }
}

// Run the build
if (require.main === module) {
    const builder = new BuildScript();
    builder.build();
}

module.exports = BuildScript;