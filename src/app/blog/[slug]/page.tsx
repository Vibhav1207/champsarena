import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import blogPosts from "@/data/blog.json";
import { GAMES_DATA } from "@/data/games";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Blog Post Not Found | ChampsArena",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords.join(", "),
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `${baseUrl}/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [
        {
          url: `${baseUrl}/logo.png`,
          width: 500,
          height: 500,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [`${baseUrl}/logo.png`],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  // Related games cross-linking mapping
  const relatedGameSlug = post.category.toLowerCase().includes("pokemon")
    ? "pokemon"
    : post.category.toLowerCase().includes("free fire")
      ? "free-fire"
      : post.category.toLowerCase().includes("bgmi")
        ? "bgmi"
        : post.category.toLowerCase().includes("valorant")
          ? "valorant"
          : null;

  const relatedGame = relatedGameSlug ? GAMES_DATA[relatedGameSlug] : null;

  // Find related articles (excluding the current one)
  const relatedArticles = blogPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 2);

  // Generate Schemas (Article + FAQPage + BreadcrumbList)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${baseUrl}/blog/${slug}#article`,
        "url": `${baseUrl}/blog/${slug}`,
        "headline": post.title,
        "description": post.metaDescription,
        "datePublished": post.publishedAt,
        "dateModified": post.publishedAt,
        "author": {
          "@type": "Person",
          "name": post.author,
          "image": post.authorImage
        },
        "publisher": {
          "@type": "Organization",
          "name": "ChampsArena",
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/logo.png`
          }
        },
        "mainEntityOfPage": `${baseUrl}/blog/${slug}`
      },
      post.faqs && post.faqs.length > 0 ? {
        "@type": "FAQPage",
        "@id": `${baseUrl}/blog/${slug}#faq`,
        "mainEntity": post.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      } : null,
      {
        "@type": "BreadcrumbList",
        "@id": `${baseUrl}/blog/${slug}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": `${baseUrl}/blog`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": post.title,
            "item": `${baseUrl}/blog/${slug}`
          }
        ]
      }
    ].filter(Boolean)
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <main className="max-w-container-max mx-auto px-md py-xl min-h-screen text-left">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-md select-none text-xs font-bold uppercase text-primary/60">
          <ol className="flex items-center gap-xs list-none p-0 m-0">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            </li>
            <li>/</li>
            <li aria-current="page" className="text-primary truncate max-w-[200px]">
              {post.title}
            </li>
          </ol>
        </nav>

        {/* Article Layout */}
        <div className="grid grid-cols-12 gap-md lg:gap-xl">
          {/* Article content */}
          <article className="col-span-12 lg:col-span-8 bg-white border-4 border-primary neo-brutalist-shadow p-md md:p-xl space-y-lg">
            <header className="border-b-4 border-primary pb-md select-none">
              <span className="bg-primary text-white px-2 py-1 text-xs font-black uppercase tracking-wider mb-sm inline-block">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight tracking-tight text-primary mt-xs">
                {post.title}
              </h1>

              {/* Author & Meta */}
              <div className="flex items-center gap-sm mt-md">
                <div className="w-10 h-10 border-2 border-primary relative overflow-hidden bg-accent-yellow shrink-0">
                  <img src={post.authorImage} alt={post.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-black text-sm uppercase text-primary">{post.author}</p>
                  <p className="text-[10px] font-bold text-primary/50 uppercase leading-none">
                    {new Date(post.publishedAt).toLocaleDateString()} • {post.readTime}
                  </p>
                </div>
              </div>
            </header>

            {/* Table of Contents */}
            {post.toc && post.toc.length > 0 && (
              <section className="bg-surface-container-high border-4 border-dashed border-primary p-md select-none">
                <h3 className="font-black text-sm uppercase text-primary mb-sm">Table of Contents</h3>
                <ul className="space-y-xs list-none p-0 m-0">
                  {post.toc.map((tocItem) => (
                    <li key={tocItem.id}>
                      <a
                        href={`#${tocItem.id}`}
                        className="text-accent-blue font-bold uppercase text-xs hover:underline"
                      >
                        • {tocItem.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Post Content Body */}
            <div className="text-primary font-medium space-y-md text-sm md:text-base leading-relaxed whitespace-pre-line">
              {post.content}
            </div>

            {/* FAQ section */}
            {post.faqs && post.faqs.length > 0 && (
              <section className="border-t-4 border-primary pt-xl space-y-md">
                <h2 className="text-2xl font-black uppercase text-primary mb-md select-none">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-sm">
                  {post.faqs.map((faq, idx) => (
                    <div key={idx} className="border-2 border-primary p-md bg-surface-container-low text-left">
                      <h4 className="font-black text-base uppercase text-primary">{faq.question}</h4>
                      <p className="text-sm font-medium text-primary mt-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4 space-y-xl">
            {/* Related Game link */}
            {relatedGame && (
              <section className="bg-accent-yellow p-md border-4 border-primary neo-brutalist-shadow select-none text-left">
                <h3 className="font-headline-sm uppercase mb-sm">Competes in {relatedGame.name}?</h3>
                <p className="text-xs text-primary font-bold uppercase mb-md">
                  ChampsArena offers daily tournaments, ELO ladder tracking, and rewards for this title.
                </p>
                <Link
                  href={`/games/${relatedGame.slug}`}
                  className="w-full text-center py-2 bg-primary text-white border-2 border-primary font-black uppercase text-xs hover:translate-y-[-1px] transition-all block"
                >
                  Join {relatedGame.name} Arena
                </Link>
              </section>
            )}

            {/* Related Articles */}
            <section className="bg-white p-md border-4 border-primary neo-brutalist-shadow select-none text-left">
              <h3 className="font-headline-sm uppercase mb-md">Related Articles</h3>
              <div className="space-y-md">
                {relatedArticles.map((article) => (
                  <div key={article.slug} className="border-2 border-primary p-sm">
                    <span className="text-[9px] font-black text-primary/50 uppercase block mb-1">
                      {article.category}
                    </span>
                    <h4 className="font-black text-xs uppercase text-primary leading-tight line-clamp-2">
                      {article.title}
                    </h4>
                    <Link
                      href={`/blog/${article.slug}`}
                      className="text-[10px] font-black text-accent-blue uppercase hover:underline mt-sm inline-block"
                    >
                      Read Guide →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
