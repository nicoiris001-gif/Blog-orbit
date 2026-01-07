// Individual Post Page Manager
class PostManager {
    constructor() {
        this.post = null;
        this.slug = null;
        this.init();
    }

    init() {
        this.slug = this.getSlugFromUrl();
        if (this.slug) {
            this.loadPost();
        } else {
            this.showError('Post not found');
        }
    }

    getSlugFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('slug');
    }

    async loadPost() {
        try {
            // Wait for blog manager to be available
            if (!window.blogManager) {
                setTimeout(() => this.loadPost(), 100);
                return;
            }

            this.post = window.blogManager.getPostBySlug(this.slug);
            
            if (!this.post) {
                this.showError('Post not found');
                return;
            }

            this.renderPost();
            this.updateMetaTags();
            this.setupShareButtons();
            this.loadRelatedPosts();
        } catch (error) {
            console.error('Failed to load post:', error);
            this.showError('Failed to load post content');
        }
    }

    renderPost() {
        if (!this.post) return;

        // Update page title and content
        document.getElementById('post-title').textContent = this.post.title;
        document.getElementById('post-h1').textContent = this.post.title;
        document.getElementById('post-content').innerHTML = this.post.content;
        
        // Update meta information
        const postDate = document.getElementById('post-date');
        if (postDate) {
            postDate.textContent = this.formatDate(this.post.date);
            postDate.setAttribute('datetime', this.post.date);
        }

        // Update category
        const categoryElement = document.getElementById('post-category');
        if (categoryElement && this.post.category) {
            categoryElement.textContent = this.post.category;
        }

        // Update tags
        const tagsContainer = document.getElementById('post-tags');
        if (tagsContainer && this.post.tags) {
            tagsContainer.innerHTML = this.post.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        }

        // Update featured image
        const featuredImage = document.getElementById('post-featured-image');
        if (featuredImage && this.post.image) {
            featuredImage.src = this.post.image;
            featuredImage.alt = this.post.title;
            featuredImage.style.display = 'block';
        }
    }

    updateMetaTags() {
        if (!this.post) return;

        const currentUrl = window.location.href;
        const description = this.post.description || this.post.excerpt;
        const image = this.post.image || '';

        // Update basic meta tags
        document.getElementById('post-description').setAttribute('content', description);
        document.getElementById('post-canonical').setAttribute('href', currentUrl);

        // Update Open Graph tags
        document.getElementById('og-url').setAttribute('content', currentUrl);
        document.getElementById('og-title').setAttribute('content', this.post.title);
        document.getElementById('og-description').setAttribute('content', description);
        if (image) {
            document.getElementById('og-image').setAttribute('content', image);
        }

        // Update Twitter tags
        document.getElementById('twitter-url').setAttribute('content', currentUrl);
        document.getElementById('twitter-title').setAttribute('content', this.post.title);
        document.getElementById('twitter-description').setAttribute('content', description);
        if (image) {
            document.getElementById('twitter-image').setAttribute('content', image);
        }

        // Update structured data
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": this.post.title,
            "description": description,
            "image": image,
            "author": {
                "@type": "Person",
                "name": this.post.author || "Blog Author"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Professional Blog"
            },
            "datePublished": this.post.date,
            "dateModified": this.post.date,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": currentUrl
            }
        };

        document.getElementById('structured-data').textContent = JSON.stringify(structuredData);
    }

    setupShareButtons() {
        if (!this.post) return;

        const currentUrl = window.location.href;
        const title = this.post.title;

        // Setup share button URLs
        const twitterBtn = document.getElementById('share-twitter');
        const facebookBtn = document.getElementById('share-facebook');
        const linkedinBtn = document.getElementById('share-linkedin');

        if (twitterBtn) {
            twitterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                shareOnTwitter(currentUrl, title);
            });
        }

        if (facebookBtn) {
            facebookBtn.addEventListener('click', (e) => {
                e.preventDefault();
                shareOnFacebook(currentUrl);
            });
        }

        if (linkedinBtn) {
            linkedinBtn.addEventListener('click', (e) => {
                e.preventDefault();
                shareOnLinkedIn(currentUrl, title);
            });
        }
    }

    loadRelatedPosts() {
        if (!this.post || !window.blogManager) return;

        const allPosts = window.blogManager.getPosts();
        const relatedPosts = this.getRelatedPosts(allPosts, 3);
        
        const relatedContainer = document.getElementById('related-posts-grid');
        if (relatedContainer && relatedPosts.length > 0) {
            relatedContainer.innerHTML = relatedPosts.map(post => 
                this.createRelatedPostCard(post)
            ).join('');
        }
    }

    getRelatedPosts(allPosts, limit = 3) {
        if (!this.post) return [];

        // Filter out current post and find related posts
        const otherPosts = allPosts.filter(post => post.slug !== this.post.slug);
        
        // Score posts based on category and tags similarity
        const scoredPosts = otherPosts.map(post => {
            let score = 0;
            
            // Same category gets higher score
            if (post.category === this.post.category) {
                score += 3;
            }
            
            // Shared tags get points
            if (this.post.tags && post.tags) {
                const sharedTags = this.post.tags.filter(tag => 
                    post.tags.includes(tag)
                );
                score += sharedTags.length;
            }
            
            return { post, score };
        });

        // Sort by score and return top posts
        return scoredPosts
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.post);
    }

    createRelatedPostCard(post) {
        const imageHtml = post.image ? 
            `<img src="${post.image}" alt="${post.title}" loading="lazy">` : '';

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

    showError(message) {
        document.getElementById('post-title').textContent = 'Error';
        document.getElementById('post-h1').textContent = 'Post Not Found';
        document.getElementById('post-content').innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <p><a href="/">← Back to Home</a></p>
            </div>
        `;
    }
}

// Initialize post manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PostManager();
});