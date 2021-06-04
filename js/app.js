// references to HTML elements
const courseInformationSection = document.getElementById("courseInformation");
const courseSearchButton = document.getElementById("searchBtn");
const courseSearchInput = document.getElementById("courseSearch");

/**
 * Initialize the UI components.
 */
(async function initUI() {
    // search for course data on search button click
    courseSearchButton.onclick = getCourseData;

    // search for course data on Enter button press
    courseSearchInput.onkeyup = e => {
        if (e.key == "Enter") 
        {
            getCourseData();
        }
    }
})();

/**
 * Search for course data from the Gritview API.
 */
function getCourseData() {
    let query = document.getElementById("courseSearch").value;
    query = query.split(" ").join("");

    fetch(`https://api.gritview.io/course?course=${query}`)
        .then(response => response.json())
        .then(getOfferingInformation)
        .catch(showSearchErrorMessage);
}

/**
 * Show an error message that the search query did not return any data.
 */
function showSearchErrorMessage() {
    // clear out previous course information (if any)
    courseInformation.innerHTML = "";

    createElement(courseInformation, "h3", {
        text: "An error occured"
    });

    createElement(courseInformation, "p", {
        text: "We are sorry to say that your search has failed. Please check your search terms and try again."
    });

    createElement(courseInformation, "p", {
        text: "The surefire way to find a match is to do the department code in ALL CAPS followed by the number."
    });

    createElement(courseInformation, "p", {
        text: "Ex: CMSC411"
    });
}

/**
 * Get the offerning information about a course (latest offerings, instructors, etc).
 * @param {Object} course 
 */
function getOfferingInformation(course) {
    // if the course query was well-formed, but replied back with no data
    if (!Object.keys(course.subject).length) 
    {
        showSearchErrorMessage();

        return;
    }

    // clear out previous course information (if any)
    courseInformation.innerHTML = "";

    // destructure name information from subject sub-object and put together course name
    const { name, catalog_number, description } = course.subject;
    const courseName = `${name} ${catalog_number} - ${description}`;

    createElement(courseInformation, "h3", {
        text: courseName
    });

    // latest semester is listed first in the response body
    const latestOffering = course.semesters[0];
    createElement(courseInformation, "p", {
        innerHTML: `<b>Latest Offering:</b> ${latestOffering}`
    });

    // go through each type of semester to show the latest offering
    [ "Fall", "Spring", "Winter", "Summer" ].forEach(semester => {
        // get the latest semesterly offering
        const lastSemesterlyOffering = course.semesters.find(x => x.includes(semester));

        // show latest semesterly offering
        if (lastSemesterlyOffering)
        {
            createElement(courseInformation, "p", {
                innerHTML: `<b>Last ${semester} Offering:</b> ${lastSemesterlyOffering}`
            });
        }
        // state that the course has not been historically offered during that semester
        else
        {
            createElement(courseInformation, "p", {
                innerHTML: `<b>Last ${semester} Offering:</b> Not since at least 2017`
            });
        }
    });

    // create an instructor lookup table by instructor id
    const instructors = {};
    course.instructors.forEach(x => {
        instructors[x.id] = `${x.first_name} ${x.last_name}`;
    });

    // create list header
    createElement(courseInformation, "b", { text: "All Offerings:" });

    /**
     * the course grade semesters are sorted by id which are numerical and need to be reversed to match
     * the reverse chronological ordering of the semesters
     */
    const grades = course.grades.reverse();
 
    const offeringList = createElement(courseInformation, "ul");
    course.semesters.forEach((semester, i) => {
        createElement(offeringList, "li", { 
            text: `${semester} (Taught by: ${instructors[grades[i].instructor_id]})`
        });
    });
}

/**
 * Create an HTML element and add it to the DOM tree.
 * @param {HTMLElement} parent 
 * @param {String} tag 
 * @param {Object} attributes 
 */
function createElement(parent, tag, attributes = {}) {
    // create the element to whatever tag was given
    const el = document.createElement(tag);

    // go through all the attributes in the object that was given
    Object.entries(attributes)
        .forEach(([attr, value]) => {
            // handle the various special cases that will cause the Element to be malformed
            if (attr == "innerText") {
                el.innerText = value;
            }
            else if (attr == "innerHTML") {
                el.innerHTML = value;
            }
            else if (attr == "textContent" || attr == "text") {
                el.textContent = value;
            }
            else if (attr == "onclick") {
                el.onclick = value;
            }
            else if (attr == "onkeydown") {
                el.onkeydown = value;
            }
            else {
                el.setAttribute(attr, value);
            }
        });

    // add the newly created element to its parent
    parent.appendChild(el);

    // return the element in case this element is a parent for later element creation
    return el;
}