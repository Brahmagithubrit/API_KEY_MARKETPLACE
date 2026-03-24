// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract APIRegistry {

    uint public counter = 0;

    struct Api {
        uint id;
        address owner;
        string endpoint;
        uint pricePerCall;
        uint totalEarned;
        bool active;
}

    mapping(uint => Api) public apis;
    mapping(address => mapping(uint => uint)) public credits;

   
    event APIRegistered(uint id, address owner, string endpoint, uint price);
    event CreditsBought(address user, uint apiId, uint amount);
    event CreditUsed(address user, uint apiId);
    event Withdrawn(address owner, uint apiId, uint amount);

    function registerApi(string memory endpoint, uint pricePerCall) public {
        require(pricePerCall > 0, "Invalid price");
        require(bytes(endpoint).length > 0, "Empty endpoint");

        counter++;

        apis[counter] = Api(
            counter,
            msg.sender,
            endpoint,
            pricePerCall,
            0,
            true
        );

        emit APIRegistered(counter, msg.sender, endpoint, pricePerCall);
    }

    function buyCredits(uint apiId) public payable {
        Api storage api = apis[apiId];

        require(api.id != 0, "API does not exist");
        require(api.active, "API not active");
        require(msg.value > 0, "Send ETH");

        uint creditAmount = msg.value / api.pricePerCall;
        require(creditAmount > 0, "Insufficient ETH");

        credits[msg.sender][apiId] += creditAmount;
        api.totalEarned += msg.value;

        emit CreditsBought(msg.sender, apiId, creditAmount);
    }

    function useCredit(uint apiId) public {
        Api storage api = apis[apiId];

        require(api.id != 0, "API does not exist");
        require(api.active, "API not active");
        require(credits[msg.sender][apiId] > 0, "No credits");

        credits[msg.sender][apiId] -= 1;

        emit CreditUsed(msg.sender, apiId);
    }

    function withdraw(uint apiId) public {
        Api storage api = apis[apiId];

        require(api.id != 0, "API does not exist");
        require(msg.sender == api.owner, "Not owner");
        require(api.totalEarned > 0, "No earnings");

        uint amount = api.totalEarned;
        api.totalEarned = 0;

        payable(api.owner).transfer(amount);

        emit Withdrawn(msg.sender, apiId, amount);
    }

    
    receive() external payable {
        revert("Direct ETH not allowed");
    }
}