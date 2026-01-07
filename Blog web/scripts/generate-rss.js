// RSS Feed Generator Script
const fs = require('fs');
const path = require('path');

class RSSGenerator {
    constructor() {
        this.baseUrl = 'https://yourdomain.com'; // Change this to your domain
        this.blogTitle = 'Professional Blog';
        this.blogDescription = 'A professional blog featuring the latest insights on technology, development, and industry trends.';
        this.posts = [];
        this.rss = '';
    }

    async generateRSS() {
        try {
            await this.loadPosts();
            this.createRSSXML();
            this.writeRSS();
            console.log('✅ RSS feed generated successfully!');
        } catch (error) {
            console.error('❌ Error generating RSS feed:', error);
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

        // Sort posts by date (newest first)
        this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
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

        const markdownContent = lines.slice(frontMatterEnd + 1).join('\n');
        const excerpt = this.generateExcerpt(markdownContent);

        return {
            ...frontMatter,
            slug: filename.replace('.md', ''),
            excerpt: excerpt,
            pubDate: this.formatRSSDate(frontMatter.date)
        };
    }

    generateExcerpt(content, length = 200) {
        const text = content.replace(/[#*`>\[\]()]/g, '').trim();
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatRSSDate(dateString) {
        const date = new Date(dateString);
        return date.toUTCString();
    }

    escapeXML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    createRSSXML() {
        const currentDate = new Date().toUTCString();
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>${this.escapeXML(this.blogTitle)}</title>
        <description>${this.escapeXML(this.blogDescription)}</description>
        <link>${this.baseUrl}/</link>
        <atom:link href="${this.baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
        <language>en-us</language>
        <lastBuildDate>${currentDate}</lastBuildDate>
        <generator>Custom RSS Generator</generator>`;

        // Add blog posts (limit to 20 most recent)
        this.posts.slice(0, 20).forEach(post => {
            const postUrl = `${this.baseUrl}/post.html?slug=${post.slug}`;
            
            xml += `
        <item>
            <title>${this.escapeXML(post.title)}</title>
            <description>${this.escapeXML(post.description || post.excerpt)}</description>
            <link>${postUrl}</link>
            <guid isPermaLink="true">${postUrl}</guid>
            <pubDate>${post.pubDate}</pubDate>
            <author>${this.escapeXML(post.author || 'Blog Author')}</author>`;
            
            if (post.category) {
                xml += `
            <category>${this.escapeXML(post.category)}</category>`;
            }
            
            xml += `
        </item>`;
        });

        xml += `
    </channel>
</rss>`;
        
        this.rss = xml;
    }

    writeRSS() {
        const rssPath = path.join(__dirname, '../rss.xml');
        fs.writeFileSync(rssPath, this.rss);
    }
}

// Run the generator
if (require.main === module) {
    const generator = new RSSGenerator();
    generator.generateRSS();
}

module.exports = RSSGenerator;