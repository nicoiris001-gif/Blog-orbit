// Auto-Discovery Blog System - No manual configuration needed
class AutoBlogManager {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        await this.autoDiscoverPosts();
        this.setupEventListeners();
        this.setupTheme();
        this.renderPosts();
        this.renderCategories();
    }

    async autoDiscoverPosts() {
        try {
            // Try to discover posts automatically
            const commonPostNames = [
                'getting-started-with-web-development.md',
                'javascript-best-practices-2024.md',
                'responsive-design-techniques.md',
                'seo-optimization-guide.md',
                'auto-discovery-test.md'
            ];

            // Check for posts.json first, then fallback to auto-discovery
            let postFiles = [];
            try {
                const response = await fetch('posts/posts.json');
                if (response.ok) {
                    const config = await response.json();
                    postFiles = config.posts;
                }
            } catch {
                // Use common post names as fallback
                postFiles = commonPostNames;
            }

            // Try to load additional posts by scanning common patterns
            const additionalPatterns = [
                // Add more patterns as needed
                'new-post.md',
                'latest-post.md',
                'blog-post.md'
            ];

            const allPossibleFiles = [...new Set([...postFiles, ...additionalPatterns])];

            for (const postFile of allPossibleFiles) {
                try {
                    const response = await fetch(`posts/${postFile}`);
                    if (response.ok) {
                        const content = await response.text();
                        const post = this.parseMarkdown(content, postFile);
                        if (post && post.title) { // Only add valid posts
                            this.posts.push(post);
                        }
                    }
                } catch (error) {
                    // Silently skip missing files
                }
            }

            // Sort by date (newest first)
            this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.filteredPosts = [...this.posts];

            console.log(`✅ Auto-discovered ${this.posts.length} blog posts`);
        } catch (error) {
            console.error('Auto-discovery failed:', error);
        }
    }

    parseMarkdown(content, filename) {
        const lines = content.split('\n');
        let frontMatterEnd = -1;
        let frontMatter = {};

        // Parse front matter
        if (lines[0] === '---') {
            for (let i = 1; i < lines.length; i++) {
                if (lines[i] === '---') {
                    frontMatterEnd = i;
                    break;
                }
                const [key, ...valueParts] = lines[i].split(':');
                if (key && valueParts.length > 0) {
                    let value = valueParts.join(':').trim();
                    if (value.startsWith('[') && value.endsWith(']')) {
                        value = value.slice(1, -1).split(',').map(tag => tag.trim().replace(/['"]/g, ''));
                    } else {
                        value = value.replace(/['"]/g, '');
                    }
                    frontMatter[key.trim()] = value;
                }
            }
        }

        if (frontMatterEnd === -1 || !frontMatter.title) return null;

        const markdownContent = lines.slice(frontMatterEnd + 1).join('\n');
        const htmlContent = this.markdownToHtml(markdownContent);

        return {
            ...frontMatter,
            content: htmlContent,
            slug: filename.replace('.md', ''),
            excerpt: this.generateExcerpt(markdownContent)
        };
    }

    markdownToHtml(markdown) {
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img alt="$1" src="$2" />')
            .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>')
            .replace(/`([^`]*)`/gim, '<code>$1</code>')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/\n\n/gim, '</p><p>')
            .replace(/^(.*)$/gim, '<p>$1</p>')
            .replace(/<p><\/p>/gim, '')
            .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/gim, '$1')
            .replace(/<p>(<blockquote>.*<\/blockquote>)<\/p>/gim, '$1');
    }

    generateExcerpt(content, length = 150) {
        const text = content.replace(/[#*`>\[\]()]/g, '').trim();
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterPosts();
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.filterPosts();
            });
        }

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    renderCategories() {
        const categoriesContainer = document.getElementById('category-filters');
        if (!categoriesContainer) return;

        const categories = ['all', ...new Set(this.posts.map(post => post.category).filter(Boolean))];
        
        categoriesContainer.innerHTML = categories.map(category => 
            `<button class="category-filter ${category === this.currentCategory ? 'active' : ''}" 
                     data-category="${category}">
                ${category === 'all' ? 'All Posts' : category}
            </button>`
        ).join('');

        categoriesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-filter')) {
                document.querySelectorAll('.category-filter').forEach(btn => 
                    btn.classList.remove('active')
                );
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.filterPosts();
            }
        });
    }

    filterPosts() {
        this.filteredPosts = this.posts.filter(post => {
            const matchesCategory = this.currentCategory === 'all' || post.category === this.currentCategory;
            const matchesSearch = !this.searchTerm || 
                post.title.toLowerCase().includes(this.searchTerm) ||
                post.description.toLowerCase().includes(this.searchTerm) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)));
            
            return matchesCategory && matchesSearch;
        });

        this.renderPosts();
    }

    renderPosts() {
        const postsContainer = document.getElementById('blog-posts');
        const noResults = document.getElementById('no-results');
        
        if (!postsContainer) return;

        if (this.filteredPosts.length === 0) {
            postsContainer.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';

        postsContainer.innerHTML = this.filteredPosts.map(post => 
            this.createPostCard(post)
        ).join('');
    }

    createPostCard(post) {
        const imageHtml = post.image ? 
            `<img src="${post.image}" alt="${post.title}" loading="lazy">` : '';
        
        const tagsHtml = post.tags ? 
            `<div class="blog-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>` : '';

        return `
            <article class="blog-card">
                ${imageHtml}
                <div class="blog-card-content">
                    <h3><a href="post.html?slug=${post.slug}">${post.title}</a></h3>
                    <div class="blog-card-meta">
                        <time datetime="${post.date}">${this.formatDate(post.date)}</time>
                        <span>${post.category || 'Uncategorized'}</span>
                    </div>
                    <p>${post.excerpt}</p>
                    ${tagsHtml}
                </div>
            </article>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getPosts() {
        return this.posts;
    }

    getPostBySlug(slug) {
        return this.posts.find(post => post.slug === slug);
    }
}

// Initialize auto-discovery blog manager
document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new AutoBlogManager();
});

// Utility functions for sharing
function shareOnTwitter(url, title) {
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareOnFacebook(url) {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareOnLinkedIn(url, title) {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}