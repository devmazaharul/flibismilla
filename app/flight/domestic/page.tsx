import FlightTemplate from "../compo/FlightTemplate";


const DomesticFlightsPage = () => {
    return (
        <FlightTemplate 
            type="domestic"
            title="Domestic Flights"
            subtitle="Explore Bangladesh"
            bgImage="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000" // Bangladesh Image
        />
    );
};

export default DomesticFlightsPage;