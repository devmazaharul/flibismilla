import FlightTemplate from "../compo/FlightTemplate";


const InternationalFlightsPage = () => {
    return (
        <FlightTemplate 
            type="international"
            title="International Flights"
            subtitle="Fly Around the World"
            bgImage="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000" // Plane wing view
        />
    );
};

export default InternationalFlightsPage;