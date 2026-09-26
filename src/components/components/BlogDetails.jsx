import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { getBlogById } from '../../api/blog';

const BlogDetail = () => {
  const { blogId: slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;

  // If user came from public blogs page, go back to "/blogs"
  // Otherwise, go back to the standard blogs section "/blogs-section"
  const defaultBackLink = from === "public" ? "/blogs" : "/blogs-section";

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(defaultBackLink);
    }
  };

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      try {
        const data = await getBlogById(slug);
        setBlog(data);
      } catch (error) {
        console.error("Error loading blog:", error);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  // === ENHANCED LOADING STATE ===
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[var(--color-bg-app)]">
        <div className="w-16 h-16 border-4 border-t-[var(--color-primary)] border-[var(--color-border-default)] rounded-full animate-spin"></div>
      </div>
    );
  }

  // === ENHANCED ERROR STATE ===
  if (!blog) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[var(--color-bg-app)] p-4">
        <div className="text-center bg-[var(--color-danger-bg-subtle)] text-[var(--color-danger-text)] p-8 rounded-xl border border-red-200 max-w-lg">
          <h2 className="text-2xl font-bold font-[var(--font-primary)] mb-2">Post Not Found</h2>
          <p className="text-red-800">We couldn't find the blog post you were looking for. It might have been moved or deleted.</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] font-semibold px-6 py-2 rounded-full hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              <FaArrowLeft size={14} /> Back to Articles
            </button>
            <Link 
              to="/"
              className="inline-block bg-[var(--color-bg-surface)] text-[var(--color-text-default)] border border-[var(--color-border-default)] font-semibold px-6 py-2 rounded-full hover:bg-[var(--color-bg-interactive-subtle)] transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // === ENHANCED BLOG DETAIL LAYOUT ===
  return (
    <div className="bg-[var(--color-bg-app)] text-[var(--color-text-default)] font-[var(--font-secondary)] py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2.5 px-4 py-2 bg-[var(--color-bg-surface)] hover:bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-semibold rounded-xl border border-[var(--color-border-default)] shadow-sm hover:shadow transition-all group cursor-pointer"
          >
            <FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
            Back to Articles
          </button>
        </div>

        <article className="bg-[var(--color-bg-surface)] p-6 sm:p-8 lg:p-12 rounded-2xl shadow-xl border border-[var(--color-border-default)]">
          <header className="mb-8">
            <h1 className="text-3xl md:text-5xl font-extrabold font-[var(--font-primary)] text-[var(--color-text-strong)] !leading-tight mb-4">
              {blog.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
              <span>By <span className="font-semibold text-[var(--color-text-default)]">{blog.author_name || 'TrackIntake Team'}</span></span>
              <span className="h-1 w-1 bg-[var(--color-border-default)] rounded-full"></span>
              <span>{blog.created_at ? new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent'}</span>
            </div>
          </header>

          <hr className="border-[var(--color-border-default)] mb-8" />

          {blog.image && (
            <figure className="mb-8">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-auto rounded-xl shadow-lg"
              />
            </figure>
          )}

          {/* This `prose` div enhances readability for the article content */}
          <div
            className="prose prose-lg max-w-none 
                       prose-headings:font-[var(--font-primary)] prose-headings:text-[var(--color-text-strong)]
                       prose-p:text-[var(--color-text-default)]
                       prose-a:text-[var(--color-primary)] hover:prose-a:text-[var(--color-primary-hover)] prose-a:transition-colors
                       prose-strong:text-[var(--color-text-strong)]
                       prose-blockquote:border-l-[var(--color-primary)] prose-blockquote:text-[var(--color-text-muted)]
                       prose-li:marker:text-[var(--color-primary)]"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          <div className="mt-12 pt-6 border-t border-[var(--color-border-default)] flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-on-primary)] font-semibold rounded-xl transition-all cursor-pointer"
            >
              <FaArrowLeft size={13} /> Back to Articles
            </button>
            <span className="text-xs text-[var(--color-text-muted)]">TrackIntake Knowledge Base</span>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetail;