
var HomelyApiUri = 'https://api.homely.com.au/'

chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {

        if( request.message === "clicked_browser_action" ) {

            // Grab the address of this property, if one exists.
            var address = getAddress(request.url);

            // Lookup this address in homely.
            var locationId = await getFirstLocationIdFromHomelyAsync(address);
            //var locationId = getFirstLocationIdFromHomely(address);

            // Search for properties at this location.
            // TODO: handle rentals vs sales.
            var locationDetailsUri = await getLocationDetailsUriFromHomelyAsync(locationId, address.fullAddress);

            if (locationDetailsUri === '')
            {
                return;
            }

            // oooOOoo! We have this property!
            var homelyHref = "https://www.homely.com.au/homes/" + locationDetailsUri;
    
            // Create a chrome message, so it can open this in Homely, in a new tab
            chrome.runtime.sendMessage({"message": "open_new_tab", "url": homelyHref});
        }
    }
);

function checkIfUrlIsREA(url)
{
    return url.includes("realestate.com.au");
}

function getAddress(url) {
    var isREA = checkIfUrlIsREA(url);

    // Split the address into:
    // - Suburb, State
    // - Street Number + Street.
    // - Full address
    var address;
    if (isREA) {
        address = getREAAddress();
    }
    else {
        address = getDomainAddress();
    }

    // This is the HOMELY address format.
    address.fullAddress = (address.street + ', ' + address.suburb + ' ' + address.state + ' ' + address.postcode).toUpperCase();

    return address;
}
  
function getREAAddress() {
    var address = $('h1.property-info-address').text()
    var addressParts = address.split(',');

    var statePostcode = addressParts[2].trim().split(' ');

    var address = 
    {
        street:addressParts[0].trim(),
        suburb:addressParts[1].trim(),
        state:statePostcode[0].trim(),
        postcode: statePostcode[1].trim(),
        fullAddress: ''
    };

    return address;
}

function getDomainAddress() {
    var address = document.title;

    // Domain format: Street Number Street, Suburb State Postcode | Domain
    var addressParts = address.split(',');
    var secondPart = addressParts[1].split(' '); // [space] | [suburb] | [state] | [postcode] | ["|"] | ["Domain"]

    var address = 
    {
        street:addressParts[0].trim(),
        suburb:secondPart[1].trim(),
        state:secondPart[2].trim(),
        postcode: secondPart[3].trim(),
        fullAddress: ''
    };

    return address;
}


async function getHomelyListingDetailsUrlAsync() {
    const response = await fetch()
}

async function getFirstLocationIdFromHomelyAsync(address) {
    // Try and find the location via autocomplete.
    var locationQuery = address.suburb + ', ' + address.state;
    var url = HomelyApiUri + 'search/locations?q=' + locationQuery;
    var id = await fetch(url)
                   .then((response) => response.json()) // Transform the data into json
                   .then(function(json) {
               return json.locations[0].id;
             });
     
    return id;
}

async function getLocationDetailsUriFromHomelyAsync(locationId, fullAddress) {
    // REF: https://api.homely.com.au/v1/listings?listingTypes=sale&locations[0].href=/locations/5713427&paging.skip=0&paging.take=48

    var url = HomelyApiUri + 'v1/listings?listingTypes=sale&locations[0].href=/locations/' + locationId +'&paging.skip=0&paging.take=48';
    var uri = await fetch(url)
                    .then((response) => response.json()) // Transform the data into json
                    .then(function(listings) {
                        
                        for(index in listings.results)
                        {
                            var listing = listings.results[index];

                            //console.log(fullAddress + '  ---  ' + listing.location.address)
                            if (listing.location.address.toUpperCase() === fullAddress) {

                                // REF: /listings/12345
                                var listingId = listing.id.split('/')[2];
                                return listing.uri + '/' + listingId  
                            }
                        }

                        // No listing was found.
                        // TODO: Grab next listing from the search results, etc.
                        return "";
                    });
    return uri;
}