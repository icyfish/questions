import * as React from "react"
import { Link, graphql } from "gatsby"
import Bio from "../components/Bio"
import Layout from "../components/Layout"
import Seo from "../components/Seo"
import TableOfContents from "../components/TableOfContents"
import { rhythm, scale } from "../utils/typography"
import { formatReadingTime } from "../utils/helpers"

const BlogPostTemplate = ({ data, location }) => {
  const post = data.markdownRemark
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const { previous, next } = data
  return (
    <Layout location={location} title={siteTitle}>
      <Seo
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
      />
      {post.frontmatter.toc && <TableOfContents headings={post.headings} />}
      <PageContent post={post} location={location} />
      <nav className="blog-post-nav">
        <ul
          style={{
            display: `flex`,
            flexWrap: `wrap`,
            justifyContent: `space-between`,
            listStyle: `none`,
            padding: 0,
          }}
        >
          <li>
            {previous && (
              <Link to={previous.fields.slug} rel="prev">
                ← {previous.frontmatter.title}
              </Link>
            )}
          </li>
          <li>
            {next && (
              <Link to={next.fields.slug} rel="next">
                {next.frontmatter.title} →
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </Layout>
  )
}

function PageContent({ post }) {
  return (
    <article
      className="blog-post"
      itemScope
      itemType="http://schema.org/Article"
    >
      <header>
        <h1 itemProp="headline">{post.frontmatter.title}</h1>
        <p
          style={{
            ...scale(-1 / 5),
            display: "block",
            marginBottom: rhythm(1),
            marginTop: rhythm(-4 / 5),
          }}
        >
          {post.frontmatter.date}
          {/* <span style={{ marginLeft: "10px", color: "#6d191980" }}>
              {post.wordCount.words} words
            </span> */}
          <span style={{ marginLeft: "10px" }}>
            {formatReadingTime(post.timeToRead)}
          </span>
        </p>
      </header>
      <section
        dangerouslySetInnerHTML={{ __html: post.html }}
        itemProp="articleBody"
      />
      <hr />
      <footer>
        <Bio />
      </footer>
    </article>
  )
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug(
    $id: String!
    $previousPostId: String
    $nextPostId: String
  ) {
    site {
      siteMetadata {
        title
      }
    }

    markdownRemark(id: { eq: $id }) {
      id
      excerpt(pruneLength: 160)
      html
      headings {
        value
        id
        depth
      }
      timeToRead
      wordCount {
        words
      }
      frontmatter {
        toc
        title
        date(formatString: "MMMM DD, YYYY")
        description
        draft
      }
    }
    previous: markdownRemark(id: { eq: $previousPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
      }
    }
    next: markdownRemark(id: { eq: $nextPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
      }
    }
  }
`
