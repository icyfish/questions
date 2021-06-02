import * as React from "react"
import { graphql } from "gatsby"

import BlogIndex from "./index"

const BlogDraft = ({ data, location }) => {
  return <BlogIndex data={data} location={location}/>
}

export default BlogDraft

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      filter: { frontmatter: { draft: { eq: true } } }
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
