import Hero from '../components/Hero'
import SearchBar from '../components/SearchBar'
import AuthorsMarquee from '../components/AuthorsMarquee'
import BestSellers from '../components/BestSellers'
import NewlyReleased from '../components/NewlyReleased'
import Recommendations from '../components/Recommendations'
import AuthorSpotlight from '../components/AuthorSpotlight'
import PublisherShowcase from '../components/PublisherShowcase'
import ReadingInspiration from '../components/ReadingInspiration'
import Categories from '../components/Categories'
import Reviews from '../components/Reviews'
import Newsletter from '../components/Newsletter'

export default function HomePage() {
  return (
    <>
      <Hero />
      <SearchBar />
      <AuthorsMarquee />
      <BestSellers />
      <NewlyReleased />
      <Recommendations />
      <AuthorSpotlight />
      <PublisherShowcase />
      <ReadingInspiration />
      <Categories />
      <Reviews />
      <Newsletter />
    </>
  )
}
