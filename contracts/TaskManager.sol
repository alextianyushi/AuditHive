// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TaskManager
 * @dev Manages audit tasks with ETH bounties
 *
 * Testing in Remix:
 * 1. For submitTask function:
 *    - _projectId: Enter any string (e.g., "project1")
 *    - _projectRepo: Enter repository URL (e.g., "https://github.com/user/repo")
 *    - _bountyInWei: Enter amount in Wei (e.g., for 1 ETH enter: 1000000000000000000)
 *    - In the Value field: Enter the same Wei amount as _bountyInWei
 *
 * Note: To convert ETH to Wei:
 * 1 ETH = 1000000000000000000 Wei (18 zeros)
 * 0.1 ETH = 100000000000000000 Wei (17 zeros)
 * 0.01 ETH = 10000000000000000 Wei (16 zeros)
 */
contract TaskManager is Ownable {
    struct Task {
        string projectId;
        string projectRepo;
        string title;      // Add title field
        uint256 bounty;    // stored in Wei
        address submitter;
        bool isActive;
    }
    
    // Mapping from projectId to Task
    mapping(string => Task) public tasks;
    
    // Array to store all project IDs
    string[] public projectIds;
    
    // Events
    event TaskSubmitted(string projectId, string projectRepo, string title, uint256 bounty, address submitter);
    event TaskCancelled(string projectId);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Submit a new task with ETH bounty
     * @param _projectId Unique identifier for the project
     * @param _projectRepo URL of the project repository
     * @param _title Title of the audit task
     * @param _bountyInWei Bounty amount in Wei (must match the sent ETH value)
     *
     * Example: To submit with 1 ETH
     * - _bountyInWei: 1000000000000000000
     * - Value field: 1000000000000000000
     */
    function submitTask(
        string memory _projectId,
        string memory _projectRepo,
        string memory _title,
        uint256 _bountyInWei
    ) external payable {
        require(bytes(_projectId).length > 0, "Project ID cannot be empty");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(!tasks[_projectId].isActive, "Project ID already exists");
        require(msg.value == _bountyInWei, "Sent ETH must match bounty amount");
        
        tasks[_projectId] = Task({
            projectId: _projectId,
            projectRepo: _projectRepo,
            title: _title,
            bounty: _bountyInWei,
            submitter: msg.sender,
            isActive: true
        });
        
        projectIds.push(_projectId);
        emit TaskSubmitted(_projectId, _projectRepo, _title, _bountyInWei, msg.sender);
    }
    
    /**
     * @dev Cancel a task and return the bounty to submitter
     * @param _projectId ID of the task to cancel
     */
    function cancelTask(string memory _projectId) external {
        Task storage task = tasks[_projectId];
        require(task.isActive, "Task does not exist");
        require(task.submitter == msg.sender, "Only submitter can cancel");
        
        (bool sent, ) = task.submitter.call{value: task.bounty}("");
        require(sent, "Failed to return ETH");
        
        task.isActive = false;
        emit TaskCancelled(_projectId);
    }
    
    /**
     * @dev Get task details
     * @param _projectId ID of the task
     * @return title Title of the task
     * @return projectRepo Repository URL
     * @return bounty Bounty amount in Wei
     * @return submitter Address of task submitter
     * @return isActive Whether the task is active
     */
    function getTask(string memory _projectId) external view returns (
        string memory title,
        string memory projectRepo,
        uint256 bounty,
        address submitter,
        bool isActive
    ) {
        Task memory task = tasks[_projectId];
        return (
            task.title,
            task.projectRepo,
            task.bounty,
            task.submitter,
            task.isActive
        );
    }

    /**
     * @dev Get all tasks
     * @return _projectIds Array of all project IDs
     * @return _titles Array of task titles
     * @return _projectRepos Array of repository URLs
     * @return _bounties Array of bounty amounts in Wei
     * @return _submitters Array of submitter addresses
     * @return _isActives Array of task active status
     */
    function getAllTasks() external view returns (
        string[] memory _projectIds,
        string[] memory _titles,
        string[] memory _projectRepos,
        uint256[] memory _bounties,
        address[] memory _submitters,
        bool[] memory _isActives
    ) {
        uint256 length = projectIds.length;
        _titles = new string[](length);
        _projectRepos = new string[](length);
        _bounties = new uint256[](length);
        _submitters = new address[](length);
        _isActives = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            Task memory task = tasks[projectIds[i]];
            _titles[i] = task.title;
            _projectRepos[i] = task.projectRepo;
            _bounties[i] = task.bounty;
            _submitters[i] = task.submitter;
            _isActives[i] = task.isActive;
        }

        return (projectIds, _titles, _projectRepos, _bounties, _submitters, _isActives);
    }
} 