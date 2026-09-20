import Hero from '../components/Hero'
import SearchBar from '../components/SearchBar'
import AuthorsMarquee from '../components/AuthorsMarquee'
import BestSellers from '../components/BestSellers'
import NewlyReleased from '../components/NewlyReleased'
import Recommendations from '../components/Recommendations'
import AuthorSpotlight from '../components/AuthorSpotlight'
import PublisherShowcase from '../components/PublisherShowcase'
import Categories from '../components/Categories'
import Reviews from '../components/Reviews'
import TopCustomers from '../components/TopCustomers'
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
      <Categories />
      <Reviews />
      <TopCustomers />
      <Newsletter />
    </>
  )
}
