// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;

contract voting{
	
	struct candidate_details{
		uint Candidate_id;
		string Candidate_name;
		uint totalvote;
		string party_name;
		uint Candidate_age;
		string qualificationofcandidate;
	}

	struct voter_details{
		bool alreadyvoted;
		uint vote;
		bool alreadyRegistered;
	}

	address admintxid=0x77d66E0103a64767b67f6246E83A839E0F5e042f;
	mapping(uint => candidate_details) public mapforcontestant; 
   
    mapping(address => voter_details) public mapforvoter;
	uint public contestantsCount;
	uint public sumofallvoter;

	enum PHASEoption{registerphase, votingphase , votingover}
	PHASEoption public stateoption;

	modifier Adminpermission(){
		require(msg.sender==admintxid);
		_;
	}
	
	modifier checkforstate(PHASEoption x){
	    require(stateoption==x);
	    _;
	}

	constructor() public{
		admintxid=msg.sender;
        stateoption=PHASEoption.registerphase;
	}
	//function for changing a state (registeration phase, voting phase, voting end)
    function changeState(PHASEoption x) Adminpermission public{
		require(x > stateoption);
        stateoption = x;
    }
	//function for adding new contestant
	function Newcontestant(string memory _name , string memory _party , uint _age , string memory _qualification) public Adminpermission checkforstate(PHASEoption.registerphase){
		contestantsCount++;
		mapforcontestant[contestantsCount]=candidate_details(contestantsCount,_name,0,_party,_age,_qualification);
		
	}
	// when admin verify voter via trasantion id
	function RegisterNewvoter(address user) public Adminpermission checkforstate(PHASEoption.registerphase) returns(uint){
		mapforvoter[user].alreadyRegistered=true;
		return 1;
		
	}
	//function for voting process
	function dovote(uint _contestantId) public checkforstate(PHASEoption.votingphase){
        //this checks voter is verified by admin or not
		require(mapforvoter[msg.sender].alreadyRegistered);
		//this condition checks voter already voted or not 
		require(!mapforvoter[msg.sender].alreadyvoted);

        require(_contestantId > 0 && _contestantId<=contestantsCount);
		//give a vote to candidate
		mapforcontestant[_contestantId].totalvote++;
		sumofallvoter++;
		//when you do voting this will put true in front of your transaction id
		mapforvoter[msg.sender].alreadyvoted=true;

		mapforvoter[msg.sender].vote=_contestantId;
	}
}