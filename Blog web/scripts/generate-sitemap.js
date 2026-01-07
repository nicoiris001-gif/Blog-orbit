// Sitemap Generator Script
const fs = require('fs');
const path = require('path');

class SitemapGenerator {
    constructor() {
        this.baseUrl = 'https://yourdomain.com'; // Change this to your domain
        this.posts = [];
        this.sitemap = '';
    }

    async generateSitemap() {
        try {
            await this.loadPosts();
            this.createSitemapXML();
            this.writeSitemap();
            console.log('✅ Sitemap generated successfully!');
        } catch (error) {
            console.error('❌ Error generating sitemap:', error);
        }
    }

    async loadPosts() {
        const postsConfigPath = path.join(__dirname, '../posts/posts.json');
        const postsConfig = JSON.parse(fs.readFileSync(postsConfigPath, 'utf8'));
        
        for (const postFile of postsConfig.posts) {
            const postPath = path.join(__dirname, '../posts', postFile);
            const content = fs.readFileSync(postPath, 'utf8');
            const post = this.parseMarkdown(content, postFile);
            if (post) {
                this.posts.push(post);
            }
        }
    }

    parseMarkdown(content, filename) {
        const lines = content.split('\n');
        let frontMatterEnd = -1;
        let frontMatter = {};

        if (lines[0] === '---') {
            for (let i = 1; i < lines.length; i++) {
                if (lines[i] === '---') {
                    frontMatterEnd = i;
                    break;
                }
                const [key, ...valueParts] = lines[i].split(':');
                if (key && valueParts.length > 0) {
                    let value = valueParts.join(':').trim().replace(/['"]/g, '');
                    frontMatter[key.trim()] = value;
                }
            }
        }

        if (frontMatterEnd === -1) return null;

        return {
            ...frontMatter,
            slug: filename.replace('.md', ''),
            lastmod: frontMatter.date || new Date().toISOString().split('T')[0]
        };
    }

    createSitemapXML() {
        const currentDate = new Date().toISOString().split('T')[0];
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${this.baseUrl}/</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>`;

        // Add blog posts
        this.posts.forEach(post => {
            xml += `
    <url>
        <loc>${this.baseUrl}/post.html?slug=${post.slug}</loc>
        <lastmod>${post.lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
        });

        xml += '\n</urlset>';
        this.sitemap = xml;
    }

    writeSitemap() {
        const sitemapPath = path.join(__dirname, '../sitemap.xml');
        fs.writeFileSync(sitemapPath, this.sitemap);
    }
}

// Run the generator
if (require.main === module) {
    const generator = new SitemapGenerator();
    generator.generateSitemap();
}

module.exports = SitemapGenerator;