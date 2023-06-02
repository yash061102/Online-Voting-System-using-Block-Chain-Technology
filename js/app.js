

var phaseEnum; // for changing phases of voting


App = {
  web3Provider: null,
  contracts: {},
  account:0x0,

  init: async function() {
    // Load pets.
    
   
    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log(accounts)
        setAccounts(accounts);
      } catch (error) {
        if (error.code === 4001) {
          // User rejected request
        }
      }
    }

    return await App.initContract();
  },

  initContract: async function() {
    
    const vote=await $.getJSON("voting.json")
      console.log(vote);
      App.contracts.Vote=TruffleContract(vote);
      App.contracts.Vote.setProvider(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
    App.Vote = await App.contracts.Vote.deployed();
    console.log(App.Vote)
      return await App.render();
  
  },

  render: async function(){
    
    var contestInstance;
    var loader=$("#loader");
    var content=$("#content"); 
    loader.show();
    content.hide();
    $("#after").hide();

    web3.eth.getCoinbase(function(err,account){
      if(err===null){
        App.account=account;
        $("#metamaskid").html("Your account: "+account); //
      }
    });

    

    // ------------- fetching candidates to front end from blockchain code-------------
    App.contracts.Vote.deployed().then(function(instance){
      contestInstance=instance;
      return contestInstance.contestantsCount();
    }).then(function(contestantsCount){
      
      var contestantsResults=$("#test");
      contestantsResults.empty();
      var AdminResult=$("#AdminResult");
      AdminResult.empty();

      var contestantSelect=$("#contestantSelect");
      contestantSelect.empty();

      for(var i=1; i<=contestantsCount; i++){
        contestInstance.mapforcontestant(i).then(function(contestant){
          var id=contestant[0];
          var name=contestant[1];
          var voteCount=contestant[2];
          var fetchedParty=contestant[3];
          var fetchedAge = contestant[4];
          var fetchedQualification = contestant[5]

          var contestantTemplate="<li class='table-row' style='margin-top:10px;'><div class='col col-1' style='display: flex; justify-content: center;'><div class='dp'><img class='can-img'src='/public/images/candidate.png' alt=''></div></div><div class='col col-2' style='margin-top:5px;'>" 
          + name + "</div><div class='col col-3' style='margin-top:5px;'>"+fetchedParty+"</div><div class='col col-4' style='margin-top:5px;'>"+fetchedAge+"</div><div class='col col-5' style='margin-top:5px;'>"+fetchedQualification+"</div><div class='col col-6' style='margin-top:5px;'><button class='submit' style='padding:5px; font-size:11px; width:50px;' onClick='App.castVote("+id.toString()+")'>VOTE</button></div></li>";
         
          contestantsResults.append(contestantTemplate);
          console.log(contestantTemplate)
          var contestantOption="<option style='padding: auto;' value='"+id+"'>"+name+"</option>";
          contestantSelect.append(contestantOption);

          var contestantTemplateAdmin="<li class=\"table-row\">"+"<div class=\"col col-1\">"+id+"</div>"+"<div class=\"col col-2\">"+name+"</div>"+"<div class=\"col col-3\">"+fetchedAge+"</div>"+"<div class=\"col col-4\">"+fetchedParty+"</div>"+"<div class=\"col col-5\">"+fetchedQualification+"</div>"+"<div class=\"col col-6\">"+voteCount+"</div></li>";
          
          AdminResult.append(contestantTemplateAdmin)  ;
        }); 
      }
      loader.hide();
      content.show();
    }).catch(function(error){
      console.warn(error);
    });

    // ------------- fetching current phase code -------------
    App.contracts.Vote.deployed().then(function (instance){
      return instance.stateoption();
    }).then(function(state){
      var fetchedState;
      var fetchedStateAdmin;
      phaseEnum = state.toString();
      if(state == 0){
        fetchedState = "Registration phase is on , go register yourself to vote !!";
        fetchedStateAdmin = "Registration";
      }else if(state == 1){
        fetchedState = "Voting is now live !!!";
        fetchedStateAdmin = "Voting";
      }else {
        fetchedState = "Voting is now over !!!";
        fetchedStateAdmin = "Election over";
      }
      
      var runningphase = $("#runningphase");//for user
      runningphase.empty();
      var varphase = $("#varphase");//for admin
      varphase.empty();
      var phaseTemplate = "<h1>"+fetchedState+"</h1>";
      var phaseTemplateAdmin = "<h3> Current Phase : <span style=\"color:var(--main-color)\">"+fetchedStateAdmin+"</span></h3>";
      runningphase.append(phaseTemplate);
      varphase.append(phaseTemplateAdmin);
    }).catch(function(err){
      console.error(err);
    })

    // ------------- showing result -------------
    App.contracts.Vote.deployed().then(function (instance){
      return instance.stateoption();
    }).then(function(state){
      var result = $('#Results');
      if(state == 2){
        $("#not").hide();
         
        contestInstance.contestantsCount().then(function(contestantsCount){
     
            for(var i=1; i<=contestantsCount; i++){
              contestInstance.mapforcontestant(i).then(function(contestant){
                var id=contestant[0].toString();
                var name=contestant[1];
                var voteCount=contestant[2].toString();
                var fetchedParty=contestant[3];
                var fetchedAge = contestant[4].toString();
                var fetchedQualification = contestant[5];
                contestInstance.sumofallvoter().then(function(totalvote){
                  console.log("totalvote="+totalvote)
              
                  var resultTemplate="<li class=\"table-row\">"+"<div class=\"col col-1\">"+id+"</div>"+"<div class=\"col col-2\">"+ name+"</div>"+"<div class=\"col col-3\">"+fetchedAge+"</div>"+"<div class=\"col col-4\">"+fetchedParty +"</div>"+"<div class=\"col col-5\">"+fetchedQualification+"</div>"+"<div class=\"col col-6\">"+(parseInt(voteCount)/totalvote)*100+"</div></li>";
                  result.append(resultTemplate);
                })
                
              });
            }
            
         
          }
        )
         
      } else {
        $("#generatedtable").hide();
      }
    }).catch(function(err){
      console.error(err);
    })
  },

  
  

  // // ------------- voting code -------------
  castVote: async function(id){
    
    var contestantId=id;
    await App.Vote.dovote(contestantId, {from: App.account})
  },

  // ------------- adding candidate code -------------
  addCandidate: async function(){
  console.log(App.account);
    $("#loader").hide();
    var name=$('#name').val();
    var age = $('#age').val();
    var party = $('#party').val();
    var qualification = $('#qualification').val();
    console.log(name)
    console.log(age)
    console.log(party)
    console.log(qualification)
   
    await App.Vote.Newcontestant(name,party,age,qualification, {from: App.account})
    
      $("#loader").show();
      $('#name').val('');
      $('#age').val('');
      $('#party').val('');
      $('#qualification').val('');
      location.reload();
  },

  // ------------- changing phase code -------------
  
  changeState: async function(){
    phaseEnum ++;
    await App.Vote.changeState(phaseEnum, {from: App.account})
      $("#content").hide();
      $("#loader").show();
      location.reload();

  },

  // ------------- registering voter code -------------
  registerVoter: async function(){
    var add=$('#accadd').val();
    const check=await App.Vote.RegisterNewvoter(add, {from: App.account})
      $("#content").hide();
      $("#loader").show();
      console.log(check)
      
  },

};


$(() => {
  $(window).on('load', () => {
    App.init()
  })
})