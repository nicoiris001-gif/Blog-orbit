// New Post Creator Script
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class PostCreator {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async createNewPost() {
        try {
            console.log('🚀 Creating a new blog post...\n');
            
            const postData = await this.collectPostData();
            const filename = this.generateFilename(postData.title);
            const content = this.generateMarkdownContent(postData);
            
            await this.writePost(filename, content);
            await this.updatePostsConfig(filename);
            
            console.log(`\n✅ New post created successfully!`);
            console.log(`📄 File: posts/${filename}`);
            console.log(`🔗 URL: post.html?slug=${filename.replace('.md', '')}`);
            console.log(`\n💡 Don't forget to run the sitemap and RSS generators!`);
            
        } catch (error) {
            console.error('❌ Error creating post:', error);
        } finally {
            this.rl.close();
        }
    }

    async collectPostData() {
        const postData = {};
        
        postData.title = await this.askQuestion('📝 Post title: ');
        postData.description = await this.askQuestion('📋 Meta description: ');
        postData.category = await this.askQuestion('📂 Category: ');
        postData.tags = await this.askQuestion('🏷️  Tags (comma-separated): ');
        postData.author = await this.askQuestion('👤 Author (optional): ') || 'Professional Blog';
        postData.image = await this.askQuestion('🖼️  Featured image URL (optional): ');
        
        postData.date = new Date().toISOString().split('T')[0];
        
        return postData;
    }

    askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    generateFilename(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            + '.md';
    }

    generateMarkdownContent(postData) {
        const tags = postData.tags 
            ? `[${postData.tags.split(',').map(tag => tag.trim()).join(', ')}]`
            : '[]';

        let frontMatter = `---
title: ${postData.title}
description: ${postData.description}
date: ${postData.date}
category: ${postData.category}
tags: ${tags}
author: ${postData.author}`;

        if (postData.image) {
            frontMatter += `\nimage: ${postData.image}`;
        }

        frontMatter += '\n---\n\n';

        const content = `# ${postData.title}

Write your blog post content here...

## Introduction

Start with an engaging introduction that hooks your readers.

## Main Content

Break your content into logical sections with clear headings.

### Subsection

Use subsections to organize your thoughts and make the content scannable.

## Code Examples (if applicable)

\`\`\`javascript
// Add code examples when relevant
function example() {
    console.log('Hello, World!');
}
\`\`\`

## Conclusion

Summarize your key points and provide actionable takeaways for your readers.

---

*Remember to replace this template content with your actual blog post!*`;

        return frontMatter + content;
    }

    async writePost(filename, content) {
        const postPath = path.join(__dirname, '../posts', filename);
        
        if (fs.existsSync(postPath)) {
            throw new Error(`Post with filename "${filename}" already exists!`);
        }
        
        fs.writeFileSync(postPath, content, 'utf8');
    }

    async updatePostsConfig(filename) {
        const configPath = path.join(__dirname, '../posts/posts.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Add new post to the beginning of the array (newest first)
        config.posts.unshift(filename);
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    }
}

// Run the post creator
if (require.main === module) {
    const creator = new PostCreator();
    creator.createNewPost();
}

module.exports = PostCreator;