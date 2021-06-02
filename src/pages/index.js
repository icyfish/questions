import * as React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/Bio"
import Layout from "../components/Layout"
import Seo from "../components/Seo"
import { formatReadingTime } from "../utils/helpers"

const BlogIndex = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const edges = data.allMarkdownRemark.edges
  if (edges.length === 0) {
    return (
      <Layout location={location} title={siteTitle}>
        <Seo title="All edges" />
        <Bio />
        <p>
          No blog posts found. Add markdown posts to "content/blog" (or the
          directory you specified for the "gatsby-source-filesystem" plugin in
          gatsby-config.js).
        </p>
      </Layout>
    )
  }

  return (
    <Layout location={location} title={siteTitle}>
      <Seo title="All posts" />
      <Bio />
      <ol className="title_list">
        {edges.map(edge => {
          const title = edge.node.frontmatter.title || edge.node.fields.slug

          return (
            <li key={edge.node.fields.slug}>
              <article
                className="post-list-item"
                itemScope
                itemType="http://schema.org/Article"
              >
                <header>
                  <h3>
                    <Link to={edge.node.fields.slug} itemProp="url">
                      <span itemProp="headline">{title}</span>
                    </Link>
                  </h3>
                  <small>{edge.node.frontmatter.date}</small>
                  {/* <span style={{ marginLeft: "10px", color: "#6d191980" }}>
                    {edge.node.wordCount.words} words
                  </span> */}
                  <span style={{ marginLeft: "10px" }}>
                    {formatReadingTime(edge.node.timeToRead)}
                  </span>
                </header>
                <section>
                  <p
                    dangerouslySetInnerHTML={{
                      __html:
                        edge.node.frontmatter.description || edge.node.excerpt,
                    }}
                    itemProp="description"
                  />
                </section>
              </article>
            </li>
          )
        })}
      </ol>
    </Layout>
  )
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      filter: { frontmatter: { draft: { ne: true } } }
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          wordCount {
            words
          }
          timeToRead
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            description
          }
        }
      }
    }
  }
`
